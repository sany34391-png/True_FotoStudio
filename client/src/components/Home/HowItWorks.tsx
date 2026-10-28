import { Link } from "react-router-dom";
import "./styles/HowItWorks.scss";

export default function HowItWorks() {
  return (
    <div className="how-it-works" aria-label="Как это работает">
      <div className="how-it-works-Content">
        <h2 className="how-it-works-title">Как заказать фотоальбом?</h2>
        <ol className="how-it-works-steps">
          <li>Опишите идею и пожелания к фотоальбому в заявке</li>
          <li>Мы свяжемся с вами, чтобы уточнить детали и готовые материалы</li>
          <li>Согласуем стоимость и сроки до начала печати</li>
          <li>После согласования напечатаем фотоальбом</li>
        </ol>
        <div className="how-it-works-actions">
          <Link to="/buyfoto" viewTransition className="how-it-works-button">
            Заказать фотоальбом
          </Link>
          <Link
            to="/reviews"
            viewTransition
            className="how-it-works-button how-it-works-button--secondary"
          >
            Оставить отзыв
          </Link>
        </div>
      </div>
      <aside className="how-it-works-note">
        <span aria-hidden="true">✳</span>
        <h3>Ваши фотографии — в красивом альбоме</h3>
        <p>Поможем собрать важные моменты в историю, которую приятно листать и хранить.</p>
        <img
          src="/ImgHeroStudioTrueAdam.jpg"
          alt="Примеры отпечатанных фотографий на рабочем столе"
          width={800}
          height={600}
          loading="lazy"
        />
      </aside>
    </div>
  );
}