import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchReviews, type Review } from "../../api/reviews";
import ReviewCard from "../Reviews/ReviewCard";
import "./styles/ReviewsPreview.scss";

export default function ReviewsPreview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchReviews(controller.signal)
      .then(setReviews)
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError("Не удалось загрузить отзывы. Попробуйте открыть раздел отзывов позже.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setHasLoaded(true);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="reviews-preview">
      <div className="reviews-preview__copy">
        <span className="reviews-preview__eyebrow">Нам доверяют</span>
        <h2>Отзывы о фотоальбомах</h2>
        <p>
          Если вы заказывали у нас фотоальбом, поделитесь впечатлениями о заказе.
        </p>
      </div>
      {loadError && <p className="reviews-preview__error" role="status">{loadError}</p>}
      {reviews.length > 0 && (
        <div className="reviews-preview__grid">
          {reviews.slice(0, 3).map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      )}
      <div className="reviews-preview__actions">
        <Link className="reviews-preview__button" to="/reviews" viewTransition>
          {hasLoaded && reviews.length > 0 ? "Все отзывы" : "Отзывы и форма"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}