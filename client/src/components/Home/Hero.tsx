import { Link } from "react-router-dom";
import "./styles/Hero.scss";

const ImgHeroStudio = "/ImgHeroStudio.jpg";
const ImgHeroTrueAdam = "/ImgHeroStudioTrueAdam.jpg";

export default function Hero() {
  return (
    <section className="hero" aria-label="Главный экран сайта">
      <div className="hero-content">
        <span className="hero-eyebrow">Печатаем фотоальбомы</span>
        <h1>Важные истории — в одном фотоальбоме</h1>
        <p>
          Печатаем фотоальбомы из ваших готовых фотографий, превращая их в
          цельную историю, к которой приятно возвращаться.
        </p>
        <p>Опишите идею — согласуем наполнение, стоимость и сроки до печати.</p>

        <div className="hero-buttons">
          <Link to="/buyfoto" viewTransition className="hero-button hero-button_buyfoto">
            Заказать фотоальбом
          </Link>
        </div>
      </div>

      <div className="hero-image">
        <div className="hero-image-stack">
          <img
            src={ImgHeroStudio}
            className="hero-image-studio"
            alt="Пространство студии True"
            width={500}
            height={375}
            fetchPriority="high"
          />
          <img
            src={ImgHeroTrueAdam}
            className="hero-image-trueadam"
            alt="Примеры отпечатанных фотографий True"
            width={800}
            height={600}
          />
        </div>
      </div>
    </section>
  );
}