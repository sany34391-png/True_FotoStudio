import { Link } from "react-router-dom";
import "./styles/HowItWorks.scss";

const ImgHeHowItWorksRadost = "/ImgHeHowItWorksRadost.jpg";


export default function HowItWorks() {
  return (
    <div className="how-it-works" aria-label="Как это работает">
      <div className="how-it-works-Content">
        <h2 className="how-it-works-title">Как это работает?</h2>
        <ol className="how-it-works-steps">
          <li>Оставьте заявку и загрузите фотографии</li>
          <li>Мы свяжемся с вами, уточним детали и подтвердим заказ</li>
          <li>Напечатаем фотографии и доставим заказ удобным для вас способом</li>
          <li>Поделитесь впечатлениями — будем рады вашему отзыву</li>
        </ol>
        <div className="how-it-works-actions">
          <Link to="/buyfoto" className="how-it-works-button">
            Заказать фото
          </Link>
          <Link
            to="/reviews"
            className="how-it-works-button how-it-works-button--secondary"
          >
            Оставить отзыв
          </Link>
        </div>
      </div>
      <figure className="how-it-works-photo">
        <img
          src={ImgHeHowItWorksRadost}
          alt="Фото из фотостудии"
          fetchPriority="low"
        />
        <figcaption>Ваши воспоминания — в руках</figcaption>
      </figure>
    </div>
  );
}