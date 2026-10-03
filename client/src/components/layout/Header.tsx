import { Link } from "react-router-dom";
import Logo from "../../assets/icon/logo.svg";
import "./Header.scss";

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <img src={Logo} alt="Logo" width={30} height={30} />
      </Link>

      <h1 className="header__title">True</h1>
      <button className="header_theme"></button>
      <nav className="header__nav">
        <Link to="/">Главная</Link>
        <Link to="/portfolio">Портфолио</Link>
        <Link to="/reviews">Отзывы</Link>
      </nav>
    </header>
  );
}