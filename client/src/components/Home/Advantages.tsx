import "./styles/Advantages.scss";

const items = [
  {
    number: "01",
    icon: "delivery",
    title: "Доставка по всей России",
    text: "Отправляем в любой город. Вам не нужно никуда ехать.",
  },
  {
    number: "02",
    icon: "quality",
    title: "Цвета не выцветают",
    text: "Профессиональная печать на фотобумаге, снимки остаются яркими годами.",
  },
  {
    number: "03",
    icon: "speed",
    title: "Быстро и недорого",
    text: "Заказ оформляется за пару минут, цену называем до оплаты.",
  },
];

export default function Advantages() {
  return (
    <section className="advantages" aria-labelledby="advantages-title">
      <div className="advantages__heading">
        <span className="advantages__eyebrow">Продумано для вас</span>
        <h2 id="advantages-title" className="advantages__title">
          Почему выбирают True
        </h2>
        <p>Хороший результат, понятный сервис и забота о каждом заказе.</p>
      </div>
      <ul className="advantages__list">
        {items.map((item) => (
          <li key={item.title} className="advantages__card">
            <div className="advantages__card-top">
              <span className="advantages__number">{item.number}</span>
              <svg
                className="advantages__icon"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                {item.icon === "delivery" && (
                  <>
                    <path d="M4 9h15v14H4zM19 14h5l4 4v5h-9z" />
                    <circle cx="10" cy="24" r="2.5" />
                    <circle cx="23" cy="24" r="2.5" />
                  </>
                )}
                {item.icon === "quality" && (
                  <>
                    <path d="m16 3 3.2 2.3 4-.1 1.2 3.8 3.1 2.5-1.3 3.8 1.3 3.8-3.1 2.5-1.2 3.8-4-.1L16 28l-3.2-2.3-4 .1-1.2-3.8-3.1-2.5 1.3-3.8-1.3-3.8 3.1-2.5 1.2-3.8 4 .1z" />
                    <path d="m11.5 16 3 3 6-6" />
                  </>
                )}
                {item.icon === "speed" && (
                  <>
                    <path d="M7 23a12 12 0 1 1 18 0" />
                    <path d="m16 17 6-7M8 23h16" />
                    <circle cx="16" cy="17" r="1.5" />
                  </>
                )}
              </svg>
            </div>
            <h3 className="advantages__card-title">{item.title}</h3>
            <p className="advantages__card-text">{item.text}</p>
            <span className="advantages__card-accent" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  );
}