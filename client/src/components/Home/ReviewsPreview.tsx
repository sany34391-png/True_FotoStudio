import { Link } from "react-router-dom";
import "./styles/ReviewsPreview.scss";

export default function ReviewsPreview() {
  return (
    <section className="reviews-preview">
      <div className="reviews-preview__copy">
        <span className="reviews-preview__eyebrow">Нам доверяют</span>
        <h2>Отзывы наших клиентов</h2>
        <p>
          Читайте отзывы из Яндекс.Карт и поделитесь своим впечатлением там же.
        </p>
      </div>
      <div className="reviews-preview__actions">
        <Link className="reviews-preview__button" to="/reviews" viewTransition>
          Все отзывы
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}