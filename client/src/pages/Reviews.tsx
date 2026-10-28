import { useEffect, useState, type FormEvent } from "react";
import {
  fetchReviews,
  ReviewApiError,
  reviewSubmissionSchema,
  submitReview,
  type Review,
  type ReviewField,
  type ReviewFieldErrors,
} from "../api/reviews";
import ReviewCard from "../components/Reviews/ReviewCard";
import "./Reviews.scss";

type ReviewForm = {
  name: string;
  rating: number;
  text: string;
  consent: boolean;
};

const initialForm: ReviewForm = {
  name: "",
  rating: 5,
  text: "",
  consent: false,
};

function getReviewCountLabel(count: number) {
  const pluralForm = new Intl.PluralRules("ru-RU").select(count);
  const noun = pluralForm === "one"
    ? "отзыв"
    : pluralForm === "few"
      ? "отзыва"
      : "отзывов";
  return `${count} ${noun}`;
}

function isReviewField(field: PropertyKey | undefined): field is ReviewField {
  return field === "name" || field === "rating" || field === "text" || field === "consent";
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchReviews(controller.signal)
      .then(setReviews)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Не удалось загрузить отзывы.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const updateForm = <K extends keyof ReviewForm>(field: K, value: ReviewForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const parsed = reviewSubmissionSchema.safeParse({
      ...form,
      website: "",
    });
    if (!parsed.success) {
      const errors: ReviewFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (isReviewField(field) && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const review = await submitReview(parsed.data);
      setReviews((current) => [review, ...current]);
      setForm(initialForm);
      setStatus({ type: "success", message: "Спасибо! Ваш отзыв опубликован." });
    } catch (error) {
      if (error instanceof ReviewApiError) {
        setFieldErrors(error.fieldErrors);
      }
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Не удалось отправить отзыв.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="reviews-page" aria-labelledby="reviews-title">
      <header className="reviews-page__intro">
        <span className="reviews-page__eyebrow">
          <span aria-hidden="true">✳</span> Истории клиентов
        </span>
        <h1 id="reviews-title">Добрые слова, <span>которые остаются</span></h1>
        <p>
          Заказывали у нас фотоальбом? Будем рады, если вы поделитесь впечатлениями.
        </p>
        <a className="reviews-page__jump" href="#leave-review">
          Оставить отзыв <span aria-hidden="true">↓</span>
        </a>
      </header>

      <section className="reviews-page__list-section" aria-labelledby="reviews-list-title">
        <div className="reviews-page__list-heading">
          <div>
            <span className="reviews-page__label">Впечатления</span>
            <h2 id="reviews-list-title">Отзывы клиентов</h2>
          </div>
          {averageRating && (
            <div className="reviews-page__summary" aria-label={`Средняя оценка ${averageRating} из 5`}>
              <span aria-hidden="true">★</span>
              <strong>{averageRating}</strong>
              <span>· {getReviewCountLabel(reviews.length)}</span>
            </div>
          )}
        </div>

        {isLoading && <p className="reviews-page__notice" role="status">Загружаем отзывы…</p>}
        {!isLoading && loadError && (
          <p className="reviews-page__notice reviews-page__notice--error" role="alert">
            {loadError}
          </p>
        )}
        {!isLoading && !loadError && reviews.length === 0 && (
          <div className="reviews-page__empty">
            <span aria-hidden="true">✳</span>
            <h3>Здесь появится первый отзыв</h3>
            <p>Закажите фотоальбом, а потом расскажите, как всё прошло.</p>
          </div>
        )}
        {!loadError && reviews.length > 0 && (
          <div className="reviews-page__grid">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        )}
      </section>

      <section className="reviews-page__form-section" id="leave-review" aria-labelledby="review-form-title">
        <div className="reviews-page__form-copy">
          <span className="reviews-page__label">Ваше впечатление</span>
          <h2 id="review-form-title">Расскажите о своём фотоальбоме</h2>
          <p>
            Отзыв и указанное имя появятся на сайте сразу после отправки.
            Пожалуйста, не указывайте в тексте телефон, email и другие личные данные.
          </p>
        </div>

        <form className="reviews-page__form" onSubmit={handleSubmit} noValidate>
          <input
            className="reviews-page__honeypot"
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            value=""
            readOnly
          />

          <label className="reviews-page__field">
            <span>Ваше имя</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Как к вам обращаться?"
              autoComplete="name"
              maxLength={50}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "review-name-error" : undefined}
              required
            />
            {fieldErrors.name && (
              <span className="reviews-page__field-error" id="review-name-error" role="alert">
                {fieldErrors.name}
              </span>
            )}
          </label>

          <fieldset className="reviews-page__rating">
            <legend>Ваша оценка</legend>
            <div className="reviews-page__rating-options">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} title={`${rating} из 5`}>
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={form.rating === rating}
                    onChange={() => updateForm("rating", rating)}
                  />
                  <span aria-hidden="true">★</span>
                  <span className="visually-hidden">{rating} из 5</span>
                </label>
              ))}
            </div>
            {fieldErrors.rating && (
              <span className="reviews-page__field-error" role="alert">{fieldErrors.rating}</span>
            )}
          </fieldset>

          <label className="reviews-page__field">
            <span>Ваш отзыв</span>
            <textarea
              name="text"
              value={form.text}
              onChange={(event) => updateForm("text", event.target.value)}
              placeholder="Что вам понравилось? Что можно сделать ещё лучше?"
              maxLength={1200}
              rows={5}
              aria-invalid={Boolean(fieldErrors.text)}
              aria-describedby={fieldErrors.text ? "review-text-error" : "review-text-hint"}
              required
            />
            <span className="reviews-page__hint" id="review-text-hint">
              {form.text.length} / 1200 символов
            </span>
            {fieldErrors.text && (
              <span className="reviews-page__field-error" id="review-text-error" role="alert">
                {fieldErrors.text}
              </span>
            )}
          </label>

          <label className="reviews-page__consent">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => updateForm("consent", event.target.checked)}
              aria-invalid={Boolean(fieldErrors.consent)}
              aria-describedby={fieldErrors.consent ? "review-consent-error" : undefined}
              required
            />
            <span>
              Я согласен(на) на публикацию отзыва вместе с указанным именем.
              Понимаю, что отзыв будет виден всем посетителям сайта.
            </span>
            {fieldErrors.consent && (
              <span className="reviews-page__field-error" id="review-consent-error" role="alert">
                {fieldErrors.consent}
              </span>
            )}
          </label>

          <div className="reviews-page__submit-row">
            <p>Отзывы проверяются на корректность автоматически и публикуются сразу.</p>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Отправляем…" : "Опубликовать отзыв"}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
          {status && (
            <p className={`reviews-page__status reviews-page__status--${status.type}`} role="status">
              {status.message}
            </p>
          )}
        </form>
      </section>
    </section>
  );
}
