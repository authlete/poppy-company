// The Company's public face: a branded store landing at `/`, plus robots/sitemap/llms. The look is
// the company's own (meta.brand) - this is Stays, not Authlete. Self-contained, no static assets.
// The page is composed from the small section helpers below; its CSS lives in landing-styles.ts.
import { landingStyles } from "./landing-styles.js";
import { origin, type Brand, type CompanyMeta } from "./types.js";

const PLAYGROUND = "https://poppy-playground.authlete.app";

const DEFAULT_BRAND: Brand = {
  tagline: "A place to stay.",
  blurb: "A Personal Agent Protocol reference store.",
  primary: "#0f766e",
  bg: "#faf7f1",
};

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Stays' own mark: a sun over the water.
const MARK = (color: string) =>
  `<svg width="30" height="26" viewBox="0 0 30 26" fill="none" aria-hidden="true"><circle cx="15" cy="9" r="5.5" fill="${color}"/><path d="M4 18h22M8 22.5h14" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;

// A browser opening /openapi.json would see raw JSON; serve it here as a rendered API reference.
export const apiReferencePage = (meta: CompanyMeta) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(meta.name)} · API reference</title></head>
<body style="margin:0">
<script id="api-reference" data-url="/openapi.json"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body></html>`;

const header = (meta: CompanyMeta, brand: Brand) => `<header><div class="wrap">
  <span class="brand">${MARK(brand.primary)}<span class="name serif">${esc(meta.name)}</span></span>
</div></header>`;

const hero = (meta: CompanyMeta, brand: Brand) => `<section class="hero"><div class="wrap">
  <span class="eyebrow">${esc(brand.tagline)}</span>
  <h1 class="serif">${esc(meta.name)}</h1>
  <p class="lede">${esc(brand.blurb)}</p>
  <p class="sub">${esc(meta.name)} works with your Personal Agent: it finds the store, you sign in to approve it, and it books on your behalf.</p>
  <div>
    <a class="cta" href="${PLAYGROUND}">Bring your agent →</a>
    <a class="ghost" href="/.well-known/poppy.json">Developers</a>
  </div>
</div></section>`;

// Only the bookable rooms, so it matches GET /rooms. Omitted entirely if the Company sells nothing.
const roomsSection = (meta: CompanyMeta) => {
  const cards = (meta.offerings ?? [])
    .map(
      (o) =>
        `<div class="room"><span class="room-name serif">${esc(o.name)}</span>${o.detail ? `<span class="room-detail">${esc(o.detail)}</span>` : ""}<span class="room-note">${esc(o.note)}</span></div>`,
    )
    .join("");
  if (!cards) return "";
  return `<section class="rooms-sec"><div class="wrap">
  <h2>Rooms</h2>
  <p class="note">No checkout here. Your Personal Agent books for you.</p>
  <div class="rooms">${cards}</div>
</div></section>`;
};

const devSection = () => {
  const card = (href: string, name: string, note: string) =>
    `<a class="card" href="${href}"><span class="card-name">${name}</span><span class="card-note">${note}</span><span class="arrow">↗</span></a>`;
  return `<section class="dev"><div class="wrap">
  <h2>For developers · Personal Agent Protocol</h2>
  <div class="cards">
    ${card("/.well-known/poppy.json", "poppy.json", "Who the store is and how to sign in")}
    ${card("/.well-known/oauth-protected-resource", "oauth-protected-resource", "The store's authorization server (RFC 9728)")}
    ${card("/docs", "API reference", "The API, with the scope each call needs")}
  </div>
</div></section>`;
};

const footer = (meta: CompanyMeta, brand: Brand) => `<footer><div class="wrap">
  <span class="brand">${MARK(brand.primary)}<span class="name serif" style="font-size:16px">${esc(meta.name)}</span></span>
  <span>© 2026 ${esc(meta.name)} · A Personal Agent Protocol reference demo.</span>
</div></footer>`;

export function landingPage(meta: CompanyMeta): string {
  const site = origin(meta);
  const brand = meta.brand ?? DEFAULT_BRAND;
  const title = `${meta.name} · ${brand.tagline}`;
  const description = `${meta.name}. ${brand.blurb}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: meta.name,
    url: site,
    description,
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${site}/" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${site}/" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${jsonLd}</script>
<style>
${landingStyles(brand)}
</style>
</head>
<body>
${header(meta, brand)}

${hero(meta, brand)}

${roomsSection(meta)}

${devSection()}

${footer(meta, brand)}
</body>
</html>`;
}

export const robotsTxt = (meta: CompanyMeta) =>
  `User-agent: *\nAllow: /\nSitemap: ${origin(meta)}/sitemap.xml\n`;

export const sitemapXml = (meta: CompanyMeta) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin(meta)}/</loc></url></urlset>\n`;

export const llmsTxt = (meta: CompanyMeta) =>
  `# ${meta.name}\n\n${meta.name} is a Personal Agent Protocol (Poppy) reference store.\n\n- Discovery: ${origin(meta)}/.well-known/poppy.json\n- Protected resource metadata: ${origin(meta)}/.well-known/oauth-protected-resource\n- API: ${origin(meta)}/openapi.json\n`;
