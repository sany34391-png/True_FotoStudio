import { Link } from "react-router-dom";
import "./styles/catalog.scss";

const categories = [
  {
    number: "01",
    title: "Семейный альбом",
    description: "Соберите в печатном альбоме фотографии близких и важные семейные события.",
  },
  {
    number: "02",
    title: "Альбом о путешествии",
    description: "Объедините фотографии поездки в одну историю, к которой можно возвращаться.",
  },
  {
    number: "03",
    title: "Памятный альбом",
    description: "Сохраните в альбоме фотографии праздника, встречи или другого важного дня.",
  },
];

export default function Catalog() {
  return (
    <section className="photo-catalog" aria-labelledby="photo-catalog-title">
      <div className="photo-catalog__heading">
        <span className="photo-catalog__eyebrow">Идеи для альбома</span>
        <h2 id="photo-catalog-title">Какую историю собрать в фотоальбом?</h2>
        <p>Выберите тему для ориентира, а пожелания к альбому опишите в заявке.</p>
      </div>
      <div className="photo-catalog__grid">
        {categories.map((category) => (
          <article className="photo-catalog__card" key={category.number}>
            <span className="photo-catalog__number">{category.number}</span>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
          </article>
        ))}
      </div>
      <Link className="photo-catalog__link" to="/buyfoto#photo-order-title">
        Перейти к заявке <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
