import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Страница не найдена — True";

    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";

    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <main>
      <h1>404</h1>
      <p>Страница не найдена</p>
    </main>
  );
}