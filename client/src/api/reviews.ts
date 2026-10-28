import { z } from "zod";

export const reviewSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(50),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1).max(1200),
  createdAt: z.iso.datetime(),
}).strict();

export const reviewSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя (минимум 2 символа)").max(50, "Максимум 50 символов"),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(5, "Напишите отзыв (минимум 5 символов)").max(1200, "Максимум 1200 символов"),
  consent: z.literal(true, { error: "Подтвердите согласие на публикацию" }),
  website: z.literal("").default(""),
}).strict();

export type Review = z.infer<typeof reviewSchema>;
export type ReviewSubmission = z.input<typeof reviewSubmissionSchema>;
export type ReviewField = "name" | "rating" | "text" | "consent";
export type ReviewFieldErrors = Partial<Record<ReviewField, string>>;

export class ReviewApiError extends Error {
  fieldErrors: ReviewFieldErrors;

  constructor(message: string, fieldErrors: ReviewFieldErrors = {}) {
    super(message);
    this.name = "ReviewApiError";
    this.fieldErrors = fieldErrors;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  const parsed = z.object({ error: z.string().optional() }).safeParse(payload);
  return parsed.success && parsed.data.error ? parsed.data.error : fallback;
}

export async function fetchReviews(signal?: AbortSignal): Promise<Review[]> {
  const response = await fetch("/api/reviews", { signal });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Не удалось загрузить отзывы."));
  }

  const parsed = z.array(reviewSchema).safeParse(payload);
  if (!parsed.success) {
    throw new Error("Сервер вернул отзывы в неверном формате.");
  }

  return parsed.data;
}

export async function submitReview(
  submission: z.output<typeof reviewSubmissionSchema>,
): Promise<Review> {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const parsedError = z.object({
      error: z.string().optional(),
      fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    }).safeParse(payload);
    const fieldErrors: ReviewFieldErrors = {};
    for (const field of ["name", "rating", "text", "consent"] as const) {
      const message = parsedError.success ? parsedError.data.fieldErrors?.[field]?.[0] : undefined;
      if (message) {
        fieldErrors[field] = message;
      }
    }

    throw new ReviewApiError(
      getErrorMessage(payload, "Не удалось отправить отзыв."),
      fieldErrors,
    );
  }

  const parsed = z.object({ review: reviewSchema }).safeParse(payload);
  if (!parsed.success) {
    throw new Error("Сервер вернул отзыв в неверном формате.");
  }

  return parsed.data.review;
}
