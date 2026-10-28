import { Link } from "react-router-dom";
import "./NotFound.scss";

export default function NotFound() {
  return (
    <section className="not-found">
      <span>404</span>
      <h1>Страница не найдена</h1>
      <p>Возможно, ссылка устарела или адрес был введён с ошибкой.</p>
      <Link to="/">Вернуться на главную</Link>
    </section>
  );
}