import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.scss";
import ThemeToggle from "./ThemeToggle";

const Logo = "/logo.svg";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="header" aria-label="Шапка сайта">
      <Link to="/" className="header__logo" aria-label="TRUE, перейти на главную">
        <img src={Logo} alt="Logo" width={30} height={30} />
      </Link>
      <h1 className="header__title">True</h1>
      <div className="header__theme-toggle" role="group" aria-label="Переключение темы">
        <ThemeToggle />
      </div>

      <nav
        id="main-nav"
        className={`header__nav${open ? " header__nav--open" : ""}`}
        aria-label="Основное меню"
        onClick={() => setOpen(false)}
      >
        <Link to="/">Главная</Link>
        <Link to="/buyfoto">Заказать фото</Link>
        <Link to="/portfolio">Портфолио</Link>
        <Link to="/reviews">Отзывы</Link>
      </nav>

      <button
        type="button"
        className={`header__burger${open ? " header__burger--open" : ""}`}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}