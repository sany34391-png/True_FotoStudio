import nodemailer from "nodemailer";
import { z } from "zod";

const MAX_BODY_BYTES = 32_768;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRACKED_CLIENTS = 1_000;
const MAX_CONCURRENT_EMAILS = 3;
const recipient = "t64117837@gmail.com";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(465),
  SMTP_SECURE: z.enum(["true", "false"]).default("true"),
  SMTP_USER: z.email().optional(),
  SMTP_PASS: z.string().min(1).optional(),
  ALLOWED_ORIGINS: z.string().optional(),
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

const orderSchema = z
  .object({
    messageDescription: descriptionSchema(2000, "Message description"),
    photoCount: z.number().int().min(1).max(500),
    category: descriptionSchema(100, "Photo category"),
    photoDescription: descriptionSchema(4000, "Photo description"),
    website: z.literal("").default(""),
  })
  .strict();

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
let activeEmails = 0;

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
        codePoint === 0x7f)
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
    return true;
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

function consumeRateLimit(clientAddress: string, now = Date.now()) {
  let entry = rateLimits.get(clientAddress);
  if (entry && entry.resetAt <= now) {
    rateLimits.delete(clientAddress);
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

    rateLimits.set(clientAddress, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
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

    const clientAddress = server.requestIP(request)?.address ?? "unknown";
    const rateLimit = consumeRateLimit(clientAddress);
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
      console.error("Cannot send photo order: SMTP is not configured.");
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
      `Количество фотографий: ${order.photoCount}`,
      `Категория фотографий: ${order.category}`,
      `Описание фотографий: ${order.photoDescription}`,
    ].join("\n");

    const html = `
      <h1>Новый заказ с сайта True FotoStudio</h1>
      <p><strong>Описание сообщения:</strong><br>${escapeHtml(order.messageDescription).replace(/\n/g, "<br>")}</p>
      <p><strong>Количество фотографий:</strong> ${order.photoCount}</p>
      <p><strong>Категория фотографий:</strong> ${escapeHtml(order.category)}</p>
      <p><strong>Описание фотографий:</strong><br>${escapeHtml(order.photoDescription).replace(/\n/g, "<br>")}</p>
    `;

    activeEmails += 1;
    try {
      await transporter.sendMail({
        from: env.SMTP_USER,
        to: recipient,
        subject: `Новый заказ на фото (${order.photoCount} шт.)`,
        text,
        html,
      });
    } catch {
      console.error("Failed to send photo order email through SMTP.");
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
