import { yandexReviewsUrl, yandexReviewsWidgetUrl } from "../constants/yandexReviews";
import "./Reviews.scss";

export default function Reviews() {
  return (
    <section className="reviews-page">
      <header className="reviews-page__intro">
        <span className="reviews-page__eyebrow">True · печать фотографий</span>
        <h1>Отзывы клиентов</h1>
        <p>
          Здесь собраны отзывы из карточки True на Яндекс.Картах. Хотите
          поделиться впечатлением? Оставьте отзыв на Яндексе — он появится
          здесь после публикации.
        </p>
        <a
          className="reviews-page__button"
          href={yandexReviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Оставить отзыв на Яндекс.Картах
          <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="reviews-page__yandex" aria-labelledby="yandex-reviews-title">
        <div className="reviews-page__yandex-heading">
          <div>
            <span className="reviews-page__label">Яндекс.Карты</span>
            <h2 id="yandex-reviews-title">Что о нас говорят</h2>
          </div>
          <a
            className="reviews-page__yandex-link"
            href={yandexReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Все отзывы на Яндексе <span aria-hidden="true">↗</span>
          </a>
        </div>
        <iframe
          className="reviews-page__yandex-widget"
          title="Отзывы о True на Яндекс.Картах"
          src={yandexReviewsWidgetUrl}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </section>
  );
}
