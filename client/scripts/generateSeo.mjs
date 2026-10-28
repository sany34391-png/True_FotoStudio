import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const clientDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(clientDirectory, "dist");
const siteUrl = loadEnv("production", clientDirectory, "VITE_").VITE_SITE_URL?.trim();
const pages = [
  {
    path: "/",
    title: "True FotoStudio — печать фотоальбомов",
    description:
      "Соберём готовые фотографии в фотоальбом. Оформите заявку на печать, обсудим наполнение, стоимость и сроки.",
  },
  {
    path: "/buyfoto/",
    title: "Заказать фотоальбом — True FotoStudio",
    description:
      "Оставьте заявку на печать фотоальбома из готовых фотографий. Укажите тему, количество и пожелания.",
  },
  {
    path: "/reviews/",
    title: "Отзывы клиентов — True FotoStudio",
    description:
      "Читайте отзывы о фотоальбомах True FotoStudio и расскажите о своём заказе.",
  },
  {
    path: "/privacy/",
    title: "Конфиденциальность — True FotoStudio",
    description:
      "Узнайте, как True FotoStudio обрабатывает данные заявок и опубликованных отзывов.",
  },
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function getSiteOrigin(value) {
  if (!value) {
    return null;
  }

  const parsed = new URL(value);
  if (
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    (parsed.protocol !== "https:" &&
      !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))
  ) {
    throw new Error("VITE_SITE_URL must be an HTTPS origin without a path, query, or fragment.");
  }

  return parsed.origin;
}

const origin = getSiteOrigin(siteUrl);
const indexHtml = await readFile(resolve(outputDirectory, "index.html"), "utf8");

await writeFile(
  resolve(outputDirectory, "robots.txt"),
  origin
    ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
    : "User-agent: *\nAllow: /\n",
  "utf8",
);

if (!origin) {
  await rm(resolve(outputDirectory, "sitemap.xml"), { force: true });
  console.warn("VITE_SITE_URL is not set; a sitemap and canonical URLs were not generated.");
}

for (const page of pages) {
  let html = indexHtml
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>\s*/g, "")
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>\s*/g, "")
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>\s*/g, "")
    .replace(/<script type="application\/ld\+json">[^<]*<\/script>\s*/g, "")
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(page.description)}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    );

  if (origin) {
    const canonicalUrl = new URL(page.path, `${origin}/`).href;
    const socialMetadata = [
      `<link rel="canonical" href="${canonicalUrl}" />`,
      `<meta property="og:url" content="${canonicalUrl}" />`,
      `<meta property="og:image" content="${new URL("/logo.svg", origin).href}" />`,
    ].join("\n    ");
    html = html.replace("</head>", `    ${socialMetadata}\n  </head>`);

    if (page.path === "/") {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "True FotoStudio",
        url: origin,
        telephone: "+79994311958",
        email: "t64117837@gmail.com",
      };
      html = html.replace(
        "</head>",
        `    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>\n  </head>`,
      );
    }
  }

  if (page.path !== "/") {
    const routeDirectory = resolve(outputDirectory, page.path.slice(1, -1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(resolve(routeDirectory, "index.html"), html, "utf8");
  } else {
    await writeFile(resolve(outputDirectory, "index.html"), html, "utf8");
  }
}

if (origin) {
  const urls = pages
    .map(({ path }) => `  <url><loc>${new URL(path, `${origin}/`).href}</loc></url>`)
    .join("\n");
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
  await writeFile(resolve(outputDirectory, "sitemap.xml"), sitemap, "utf8");
  console.log(`Generated SEO metadata for ${origin}.`);
}
