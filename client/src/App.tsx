import { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import BuyFoto from "./pages/BuyFoto";
import RouteMetadata from "./components/RouteMetadata";
import Privacy from "./pages/Privacy";

function AppContent() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <RouteMetadata />
      <Header />
      <main className="page-content" key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buyfoto" element={<BuyFoto />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}