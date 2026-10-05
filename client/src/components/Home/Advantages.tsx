import "./styles/Advantages.scss";

const items = [
  {
    title: "Доставка по всей России",
    text: "Отправляем в любой город. Вам не нужно никуда ехать.",
  },
  {
    title: "Цвета не выцветают",
    text: "Профессиональная печать на фотобумаге, снимки остаются яркими годами.",
  },
  {
    title: "Быстро и недорого",
    text: "Заказ оформляется за пару минут, цену называем до оплаты.",
  },
];

export default function Advantages() {
  return (
    <section className="advantages" aria-labelledby="advantages-title">
      <h2 id="advantages-title" className="advantages__title">
        Почему выбирают TRUE
      </h2>
      <ul className="advantages__list">
        {items.map((item) => (
          <li key={item.title} className="advantages__card">
            <h3 className="advantages__card-title">{item.title}</h3>
            <p className="advantages__card-text">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}