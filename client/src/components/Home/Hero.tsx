import { Link } from "react-router-dom";
import "./styles/Hero.scss";

const ImgHeroStudio = "/ImgHeroStudio.jpg";
const ImgHeroTrueAdam = "/ImgHeroStudioTrueAdam.jpg";

export default function Hero() {
  return (
    <section className="hero" aria-label="Главный экран сайта">
      <div className="hero-content">
        <h1>True - это лучший выбор в всей России</h1>
        <p>• Мы работаем онлайн и предлагаем качественные услуги по созданию уникальных фотографий для вашего бизнеса.</p>
        <p>• У нас доставка по всей России!</p>
        <p>• Мы предлагаем индивидуальный подход к каждому клиенту и делаем фотографии, которые соответствуют вашим потребностям и ожиданиям.</p>

        <div className="hero-buttons">
          <Link to="/buyfoto" viewTransition className="hero-button hero-button_buyfoto">
            Заказать фото
          </Link>
          <Link to="/portfolio" viewTransition className="hero-button hero-button_portfolio">
            Наше портфолио
          </Link>
        </div>
      </div>

      <div className="hero-image">
        <div className="hero-image-stack">
          <img
            src={ImgHeroStudio}
            className="hero-image-studio"
            alt="Фото студии"
            width={600}
            height={400}
            fetchPriority="high"
          />
          <img
            src={ImgHeroTrueAdam}
            className="hero-image-trueadam"
            alt="Фото True Adam человека сделано в студии"
            width={200}
            height={260}
          />
        </div>
      </div>
    </section>
  );
}