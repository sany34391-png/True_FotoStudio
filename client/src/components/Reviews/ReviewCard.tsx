import type { Review } from "../../api/reviews";
import "./ReviewCard.scss";

type ReviewCardProps = {
  review: Review;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article className="review-card">
      <div className="review-card__topline">
        <div
          className="review-card__stars"
          role="img"
          aria-label={`Оценка: ${review.rating} из 5`}
        >
          {"★".repeat(review.rating)}
          <span>{"★".repeat(5 - review.rating)}</span>
        </div>
        <time className="review-card__date" dateTime={review.createdAt}>
          {dateFormatter.format(new Date(review.createdAt))}
        </time>
      </div>
      <p className="review-card__text">{review.text}</p>
      <div className="review-card__author">
        <span className="review-card__avatar" aria-hidden="true">
          {review.name.trim().charAt(0).toLocaleUpperCase("ru-RU")}
        </span>
        <span>{review.name}</span>
      </div>
    </article>
  );
}
