
import { Link } from "react-router-dom";
import "./styles/CatalogPreview.scss";

export default function CatalogPreview() {
  return (
    <section className="catalog-preview" aria-labelledby="catalog-preview-title">
      <div className="catalog-preview__intro">
        <span className="catalog-preview__eyebrow">Фотоальбомы на заказ</span>
        <h2 id="catalog-preview-title">Альбом под вашу историю</h2>
        <p>
          Расскажите, что для вас важно: тему, количество экземпляров и
          пожелания к оформлению. Параметры согласуем до печати.
        </p>
      </div>
      <div className="catalog-preview__sizes" aria-label="Что указать в заявке">
        {["Тема альбома", "Количество", "Пожелания"].map((detail) => (
          <span key={detail}>{detail}</span>
        ))}
      </div>
      <Link to="/buyfoto" viewTransition className="catalog-preview__link">
        Оформить заказ <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}