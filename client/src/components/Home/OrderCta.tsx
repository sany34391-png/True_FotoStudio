
import { Link } from "react-router-dom";
import "./styles/OrderCta.scss";

export default function OrderCta() {
  return (
    <section className="order-cta" aria-labelledby="order-cta-title">
      <div>
        <span className="order-cta__eyebrow">Следующий шаг</span>
        <h2 id="order-cta-title">Соберём вашу историю в фотоальбом</h2>
        <p>Оставьте заявку — обсудим пожелания, стоимость и сроки до печати.</p>
      </div>
      <Link to="/buyfoto" viewTransition className="order-cta__button">
        Заказать фотоальбом <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}