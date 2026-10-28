import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const MAX_BODY_BYTES = 32_768;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRACKED_CLIENTS = 1_000;
const MAX_CONCURRENT_EMAILS = 3;
const MAX_PUBLIC_REVIEWS = 100;
const MAX_STORED_REVIEWS = 10_000;
const REVIEW_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const REVIEW_RATE_LIMIT_MAX_REQUESTS = 3;
const recipient = "t64117837@gmail.com";
const reviewsFilePath = fileURLToPath(
  new URL("./data/reviews.json", import.meta.url),
);

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(465),
  SMTP_SECURE: z.enum(["true", "false"]).default("true"),
  SMTP_USER: z.email().optional(),
  SMTP_PASS: z.string().min(1).optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
});

const envResult = envSchema.safeParse(Bun.env);
if (!envResult.success) {
  console.error(
    "Invalid server environment configuration. Check PORT, SMTP_PORT, SMTP_SECURE, and SMTP_USER in server/.env.",
  );
  process.exit(1);
}

const env = envResult.data;
const smtpConfigured = Boolean(
  env.SMTP_HOST &&
    env.SMTP_USER &&
    env.SMTP_PASS &&
    env.SMTP_USER !== "your-sender@gmail.com" &&
    env.SMTP_PASS !== "your-google-app-password",
);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : null;

if (!smtpConfigured) {
  console.warn("SMTP is not configured. The server will run, but cannot send email.");
}

const descriptionSchema = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} is too long`)
    .refine(
      (value) => !hasUnsupportedControlCharacters(value),
      `${label} contains unsupported control characters`,
    );

function isValidContact(value: string) {
  const compactPhone = value.replace(/[()\s-]/g, "");
  const telegramUsername = value.startsWith("@") ? value.slice(1) : value;

  return (
    /^\+?\d{7,15}$/.test(compactPhone) ||
    z.email().safeParse(value).success ||
    /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramUsername)
  );
}

const orderSchema = z
  .object({
    messageDescription: descriptionSchema(2000, "Message description"),
    albumCount: z.number().int().min(1).max(500),
    albumType: descriptionSchema(100, "Photo album theme"),
    albumDescription: descriptionSchema(4000, "Photo album description"),
    contact: descriptionSchema(254, "Contact")
      .refine(
        isValidContact,
        "Enter a phone number, email address, or Telegram username",
      ),
    website: z.literal("").default(""),
  })
  .strict();

const reviewSubmissionSchema = z
  .object({
    name: descriptionSchema(50, "Name").refine(
      (value) => value.length >= 2,
      "Name must contain at least 2 characters",
    ),
    rating: z.number().int().min(1).max(5),
    text: descriptionSchema(1200, "Review"),
    consent: z.literal(true),
    website: z.literal("").default(""),
  })
  .strict();

const storedReviewSchema = z
  .object({
    id: z.uuid(),
    name: descriptionSchema(50, "Name"),
    rating: z.number().int().min(1).max(5),
    text: descriptionSchema(1200, "Review"),
    createdAt: z.iso.datetime(),
    consentedAt: z.iso.datetime().optional(),
  })
  .strict();

const storedReviewsSchema = z.array(storedReviewSchema).max(MAX_STORED_REVIEWS);
type StoredReview = z.infer<typeof storedReviewSchema>;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
let activeEmails = 0;
let reviewWriteQueue: Promise<void> = Promise.resolve();

const securityHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { ...securityHeaders, ...headers },
  });
}

function hasUnsupportedControlCharacters(value: string) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint !== undefined &&
      (codePoint <= 0x08 ||
        (codePoint >= 0x0b && codePoint <= 0x0c) ||
        (codePoint >= 0x0e && codePoint <= 0x1f) ||
        (codePoint >= 0x7f && codePoint <= 0x9f))
    ) {
      return true;
    }
  }
  return false;
}

function isAllowedOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const developmentOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  return (
    parsedOrigin.origin === requestOrigin ||
    configuredOrigins.includes(parsedOrigin.origin) ||
    (!env.ALLOWED_ORIGINS && developmentOrigins.includes(parsedOrigin.origin))
  );
}

function getClientAddress(request: Request, fallbackAddress: string | undefined) {
  const forwardedAddress =
    env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      : undefined;

  return forwardedAddress || fallbackAddress || "unknown";
}

function consumeRateLimit(
  key: string,
  maxRequests = RATE_LIMIT_MAX_REQUESTS,
  windowMs = RATE_LIMIT_WINDOW_MS,
  now = Date.now(),
) {
  let entry = rateLimits.get(key);
  if (entry && entry.resetAt <= now) {
    rateLimits.delete(key);
    entry = undefined;
  }

  if (!entry) {
    if (rateLimits.size >= MAX_TRACKED_CLIENTS) {
      for (const [address, candidate] of rateLimits) {
        if (candidate.resetAt <= now) {
          rateLimits.delete(address);
        }
      }
    }

    if (rateLimits.size >= MAX_TRACKED_CLIENTS) {
      return { allowed: false, retryAfter: RATE_LIMIT_WINDOW_MS };
    }

    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.max(1, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

async function readStoredReviews(): Promise<StoredReview[]> {
  const contents = await readFile(reviewsFilePath, "utf8");
  const parsed = storedReviewsSchema.safeParse(JSON.parse(contents) as unknown);
  if (!parsed.success) {
    throw new Error("Stored review data does not match the expected schema.");
  }
  return parsed.data;
}

function toPublicReview(review: StoredReview) {
  return {
    id: review.id,
    name: review.name,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt,
  };
}

async function saveReview(review: StoredReview) {
  const writeOperation = reviewWriteQueue.then(async () => {
    const reviews = await readStoredReviews();
    if (reviews.length >= MAX_STORED_REVIEWS) {
      throw new Error("Review storage limit reached.");
    }

    const nextReviews = [review, ...reviews];
    const temporaryPath = join(
      dirname(reviewsFilePath),
      `.reviews-${randomUUID()}.tmp`,
    );

    await mkdir(dirname(reviewsFilePath), { recursive: true });
    try {
      await writeFile(temporaryPath, `${JSON.stringify(nextReviews, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      await rename(temporaryPath, reviewsFilePath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  });

  reviewWriteQueue = writeOperation.then(
    () => undefined,
    () => undefined,
  );
  await writeOperation;
}

async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; tooLarge: boolean }> {
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, tooLarge: false };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, tooLarge: false };
  } finally {
    reader.releaseLock();
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });

const server = Bun.serve({
  port: env.PORT,
  async fetch(request, server) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return jsonResponse({ status: "ok", emailConfigured: smtpConfigured });
    }

    if (url.pathname === "/api/reviews") {
      if (request.method === "GET") {
        try {
          const reviews = await readStoredReviews();
          return jsonResponse(reviews.slice(0, MAX_PUBLIC_REVIEWS).map(toPublicReview));
        } catch (error) {
          console.error("Could not read local reviews:", error);
          return jsonResponse({ error: "Не удалось загрузить отзывы." }, 500);
        }
      }

      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
      }

      if (!isAllowedOrigin(request)) {
        return jsonResponse({ error: "Request origin is not allowed" }, 403);
      }

      if (!request.headers.get("content-type")?.match(/^application\/json(?:\s*;|$)/i)) {
        return jsonResponse({ error: "Expected JSON request body" }, 415);
      }

      const contentLengthHeader = request.headers.get("content-length");
      if (contentLengthHeader !== null) {
        if (!/^\d+$/.test(contentLengthHeader)) {
          return jsonResponse({ error: "Invalid Content-Length" }, 400);
        }
        if (Number(contentLengthHeader) > MAX_BODY_BYTES) {
          return jsonResponse({ error: "Request is too large" }, 413);
        }
      }

      const clientAddress = getClientAddress(
        request,
        server.requestIP(request)?.address,
      );
      const rateLimit = consumeRateLimit(
        `review:${clientAddress}`,
        REVIEW_RATE_LIMIT_MAX_REQUESTS,
        REVIEW_RATE_LIMIT_WINDOW_MS,
      );
      if (!rateLimit.allowed) {
        return jsonResponse(
          { error: "Слишком много отзывов. Попробуйте отправить отзыв позже." },
          429,
          { "Retry-After": String(Math.ceil(rateLimit.retryAfter / 1000)) },
        );
      }

      const body = await readJsonBody(request);
      if (!body.ok) {
        return jsonResponse(
          { error: body.tooLarge ? "Request is too large" : "Invalid JSON" },
          body.tooLarge ? 413 : 400,
        );
      }

      if (
        typeof body.value === "object" &&
        body.value !== null &&
        "website" in body.value &&
        body.value.website !== ""
      ) {
        return jsonResponse({ message: "Спасибо за отзыв!" }, 201);
      }

      const parsed = reviewSubmissionSchema.safeParse(body.value);
      if (!parsed.success) {
        return jsonResponse(
          {
            error: "Проверьте заполнение полей.",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
          400,
        );
      }

      const now = new Date().toISOString();
      const review = storedReviewSchema.parse({
        id: randomUUID(),
        name: parsed.data.name,
        rating: parsed.data.rating,
        text: parsed.data.text,
        createdAt: now,
        consentedAt: now,
      });

      try {
        await saveReview(review);
      } catch (error) {
        console.error("Could not save local review:", error);
        return jsonResponse({ error: "Не удалось сохранить отзыв." }, 500);
      }

      return jsonResponse({ review: toPublicReview(review) }, 201);
    }

    if (url.pathname !== "/api/orders") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "POST" });
    }

    if (!isAllowedOrigin(request)) {
      return jsonResponse({ error: "Request origin is not allowed" }, 403);
    }

    if (!request.headers.get("content-type")?.match(/^application\/json(?:\s*;|$)/i)) {
      return jsonResponse({ error: "Expected JSON request body" }, 415);
    }

    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader !== null) {
      if (!/^\d+$/.test(contentLengthHeader)) {
        return jsonResponse({ error: "Invalid Content-Length" }, 400);
      }
      if (Number(contentLengthHeader) > MAX_BODY_BYTES) {
        return jsonResponse({ error: "Request is too large" }, 413);
      }
    }

    const clientAddress = getClientAddress(
      request,
      server.requestIP(request)?.address,
    );
    const rateLimit = consumeRateLimit(`order:${clientAddress}`);
    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: "Слишком много попыток. Попробуйте отправить заявку позже." },
        429,
        { "Retry-After": String(Math.ceil(rateLimit.retryAfter / 1000)) },
      );
    }

    const body = await readJsonBody(request);
    if (!body.ok) {
      return jsonResponse(
        { error: body.tooLarge ? "Request is too large" : "Invalid JSON" },
        body.tooLarge ? 413 : 400,
      );
    }

    const parsed = orderSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonResponse(
        {
          error: "Проверьте заполнение полей.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    if (!transporter || !env.SMTP_USER) {
      console.error("Cannot send photo album order: SMTP is not configured.");
      return jsonResponse(
        {
          error:
            "Отправка пока не настроена. Заполните SMTP-данные в server/.env и перезапустите сервер.",
        },
        503,
      );
    }

    if (activeEmails >= MAX_CONCURRENT_EMAILS) {
      return jsonResponse(
        { error: "Сейчас обрабатываются другие заявки. Попробуйте ещё раз через минуту." },
        503,
        { "Retry-After": "60" },
      );
    }

    const order = parsed.data;
    const text = [
      "Новый заказ с сайта True FotoStudio",
      "",
      `Описание сообщения: ${order.messageDescription}`,
      `Количество фотоальбомов: ${order.albumCount}`,
      `Тема фотоальбома: ${order.albumType}`,
      `Пожелания к фотоальбому: ${order.albumDescription}`,
      `Для обратной связи: ${order.contact}`,
    ].join("\n");

    const html = `
      <h1>Новый заказ с сайта True FotoStudio</h1>
      <p><strong>Описание сообщения:</strong><br>${escapeHtml(order.messageDescription).replace(/\n/g, "<br>")}</p>
      <p><strong>Количество фотоальбомов:</strong> ${order.albumCount}</p>
      <p><strong>Тема фотоальбома:</strong> ${escapeHtml(order.albumType)}</p>
      <p><strong>Пожелания к фотоальбому:</strong><br>${escapeHtml(order.albumDescription).replace(/\n/g, "<br>")}</p>
      <p><strong>Для обратной связи:</strong> ${escapeHtml(order.contact)}</p>
    `;

    activeEmails += 1;
    try {
      await transporter.sendMail({
        from: env.SMTP_USER,
        to: recipient,
        subject: `Новый заказ на фотоальбом (${order.albumCount} шт.)`,
        text,
        html,
      });
    } catch {
      console.error("Failed to send photo album order email through SMTP.");
      return jsonResponse(
        { error: "Не удалось отправить заказ. Попробуйте позже или свяжитесь напрямую." },
        502,
      );
    } finally {
      activeEmails -= 1;
    }

    return jsonResponse({ message: "Заказ успешно отправлен." }, 201);
  },
});

console.log(`Order mail server listening on http://localhost:${server.port}`);
