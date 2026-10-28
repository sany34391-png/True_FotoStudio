import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageMetadata: Record<string, { title: string; description: string }> = {
  "/": {
    title: "True FotoStudio — печать фотоальбомов",
    description:
      "Соберём готовые фотографии в фотоальбом. Оформите заявку на печать, обсудим наполнение, стоимость и сроки.",
  },
  "/buyfoto": {
    title: "Заказать фотоальбом — True FotoStudio",
    description:
      "Оставьте заявку на печать фотоальбома из готовых фотографий. Укажите тему, количество и пожелания.",
  },
  "/reviews": {
    title: "Отзывы клиентов — True FotoStudio",
    description:
      "Читайте отзывы о фотоальбомах True FotoStudio и расскажите о своём заказе.",
  },
  "/privacy": {
    title: "Конфиденциальность — True FotoStudio",
    description:
      "Узнайте, как True FotoStudio обрабатывает данные заявок и опубликованных отзывов.",
  },
};

function getSiteOrigin() {
  const configuredUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);
    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export default function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pageMetadata[pathname];
    const isNotFound = !page;
    const title = page?.title ?? "Страница не найдена — True FotoStudio";
    const description = page?.description ?? "Запрошенная страница не найдена.";
    const siteOrigin = getSiteOrigin();

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", isNotFound ? "noindex, nofollow" : "index, follow");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (siteOrigin && !isNotFound) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.append(canonical);
      }
      canonical.href = new URL(pathname === "/" ? "/" : `${pathname.replace(/^\//, "")}/`, `${siteOrigin}/`).href;
      upsertMeta("property", "og:url", canonical.href);
      upsertMeta("property", "og:image", new URL("/logo.svg", siteOrigin).href);
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
      document.head.querySelector('meta[property="og:image"]')?.remove();
    }

    let structuredData = document.head.querySelector<HTMLScriptElement>("#true-business-schema");
    if (pathname === "/" && siteOrigin) {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "true-business-schema";
        structuredData.type = "application/ld+json";
        document.head.append(structuredData);
      }
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "True FotoStudio",
        url: siteOrigin,
        telephone: "+79994311958",
        email: "t64117837@gmail.com",
      });
    } else {
      structuredData?.remove();
    }
  }, [pathname]);

  return null;
}
