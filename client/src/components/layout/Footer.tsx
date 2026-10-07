
import { Link } from "react-router-dom";
import { yandexReviewsUrl } from "../../constants/yandexReviews";
import "./Footer.scss";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__brand">
          <Link className="footer__logo" to="/" viewTransition aria-label="True — на главную">
            <img src="/logo.svg" alt="" width={36} height={36} />
            <span>True</span>
          </Link>
          <p>Печать фотографий и сохранение важных моментов.</p>
        </div>

        <section className="footer__contacts" aria-labelledby="footer-contacts-title">
          <h2 id="footer-contacts-title">Связаться с нами</h2>
          <a href="tel:+79994311958">
            <span className="footer__contact-label">Телефон</span>
            <span className="footer__contact-value">+7 999 431-19-58</span>
          </a>
          <a
            href="https://t.me/m1hail_true"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="footer__contact-label">Telegram</span>
            <span className="footer__contact-value">@m1hail_true</span>
          </a>
        </section>

        <nav className="footer__nav" aria-label="Навигация в подвале сайта">
          <h2>Разделы сайта</h2>
          <Link to="/" viewTransition>Главная</Link>
          <Link to="/buyfoto" viewTransition>Заказать фото</Link>
          <Link to="/portfolio" viewTransition>Портфолио</Link>
          <Link to="/reviews" viewTransition>Отзывы</Link>
          <a href={yandexReviewsUrl} target="_blank" rel="noopener noreferrer">
            Яндекс.Карты <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>

      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} True</span>
        <span>С заботой о ваших воспоминаниях</span>
      </div>
    </footer>
  );
}