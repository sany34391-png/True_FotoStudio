import "./styles/dimensionsFOTO.scss";

const details = ["Размер альбома", "Количество страниц", "Оформление"];

export default function DimensionsFOTO() {
  return (
    <section className="photo-formats" aria-labelledby="photo-formats-title">
      <div className="photo-formats__heading">
        <span className="photo-formats__eyebrow">Параметры альбома</span>
        <h2 id="photo-formats-title">Обсудим альбом до печати</h2>
        <p>
          Напишите, каким вы представляете альбом. Его размер, наполнение,
          стоимость и сроки подтвердим до начала работы.
        </p>
      </div>
      <ul className="photo-formats__list" aria-label="Параметры фотоальбома для обсуждения">
        {details.map((detail) => (
          <li key={detail}>
            <span>{detail}</span>
            <small>по согласованию</small>
          </li>
        ))}
      </ul>
    </section>
  );
}