// The Company's public face: a branded store landing at `/`, plus robots/sitemap/llms. The look is
// the company's own (meta.brand) - this is Stays, not Authlete. Self-contained, no static assets.
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

export function landingPage(meta: CompanyMeta): string {
  const site = origin(meta);
  const brand = meta.brand ?? DEFAULT_BRAND;
  const title = `${meta.name} — ${brand.tagline}`;
  const description = `${meta.name}. ${brand.blurb}`;
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: meta.name,
    url: site,
    description,
  });
  const card = (href: string, name: string, note: string) =>
    `<a class="card" href="${href}"><span class="card-name">${name}</span><span class="card-note">${note}</span><span class="arrow">↗</span></a>`;

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
  :root{--brand:${brand.primary};--bg:${brand.bg};--ink:#1c1917;--muted:#78716c;--line:#e8e1d6;--surface:#fff}
  *{box-sizing:border-box}
  html,body{margin:0}
  body{background:var(--bg);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .serif{font-family:"Iowan Old Style",Georgia,"Times New Roman",serif}
  .wrap{max-width:980px;margin:0 auto;padding:0 24px}
  header .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
  .brand{display:flex;align-items:center;gap:10px}
  .brand .name{font-size:22px;font-weight:600;letter-spacing:.01em;color:var(--ink)}
  .nav{font-size:14px;color:var(--muted)}
  .hero{position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(70% 90% at 50% -10%,color-mix(in srgb,var(--brand) 14%,var(--bg)),var(--bg) 70%);pointer-events:none}
  .hero .wrap{position:relative;padding:84px 24px 72px;text-align:center}
  .eyebrow{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);font-weight:600}
  h1{margin:18px 0 0;font-size:clamp(52px,10vw,104px);line-height:.98;letter-spacing:-.02em;color:var(--ink)}
  .lede{margin:20px auto 0;font-size:clamp(20px,3.2vw,26px);color:var(--ink);max-width:620px}
  .sub{margin:14px auto 0;color:var(--muted);max-width:560px}
  .cta{display:inline-flex;align-items:center;gap:8px;margin-top:30px;background:var(--brand);color:#fff;font-weight:600;padding:13px 22px;border-radius:999px}
  .cta:hover{filter:brightness(.93)}
  .ghost{display:inline-block;margin-top:16px;margin-left:14px;color:var(--brand);font-weight:500}
  .dev{border-top:1px solid var(--line);margin-top:48px}
  .dev .wrap{padding:44px 24px}
  .dev h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;margin:0 0 16px}
  .cards{display:grid;gap:12px;grid-template-columns:1fr}
  @media(min-width:720px){.cards{grid-template-columns:repeat(3,1fr)}}
  .card{display:flex;flex-direction:column;gap:4px;position:relative;border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:var(--surface);transition:border-color .15s,transform .15s}
  .card:hover{border-color:var(--brand);transform:translateY(-2px)}
  .card-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--ink);font-weight:600}
  .card-note{font-size:13px;color:var(--muted)}
  .card .arrow{position:absolute;top:15px;right:16px;color:var(--brand)}
  footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px}
  footer .wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:26px 24px}
</style>
</head>
<body>
<header><div class="wrap">
  <span class="brand">${MARK(brand.primary)}<span class="name serif">${esc(meta.name)}</span></span>
  <span class="nav">Reserve</span>
</div></header>

<section class="hero"><div class="wrap">
  <span class="eyebrow">${esc(brand.tagline)}</span>
  <h1 class="serif">${esc(meta.name)}</h1>
  <p class="lede">${esc(brand.blurb)}</p>
  <p class="sub">${esc(meta.name)} works with your Personal Agent — it can discover the store, sign you in, and book on your behalf.</p>
  <div>
    <a class="cta" href="${PLAYGROUND}">Bring your agent →</a>
    <a class="ghost" href="/.well-known/poppy.json">Developers</a>
  </div>
</div></section>

<section class="dev"><div class="wrap">
  <h2>For developers · Personal Agent Protocol</h2>
  <div class="cards">
    ${card("/.well-known/poppy.json", "poppy.json", "Who the store is and how to sign in")}
    ${card("/.well-known/oauth-protected-resource", "oauth-protected-resource", "RFC 9728 — the store's authorization server")}
    ${card("/openapi.json", "openapi.json", "The API, with the scope each call needs")}
  </div>
</div></section>

<footer><div class="wrap">
  <span class="brand">${MARK(brand.primary)}<span class="name serif" style="font-size:16px">${esc(meta.name)}</span></span>
  <span>© 2026 ${esc(meta.name)} · A Personal Agent Protocol reference demo.</span>
</div></footer>
</body>
</html>`;
}

export const robotsTxt = (meta: CompanyMeta) =>
  `User-agent: *\nAllow: /\nSitemap: ${origin(meta)}/sitemap.xml\n`;

export const sitemapXml = (meta: CompanyMeta) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin(meta)}/</loc></url></urlset>\n`;

export const llmsTxt = (meta: CompanyMeta) =>
  `# ${meta.name}\n\n${meta.name} is a Personal Agent Protocol (Poppy) reference store.\n\n- Discovery: ${origin(meta)}/.well-known/poppy.json\n- Protected resource metadata: ${origin(meta)}/.well-known/oauth-protected-resource\n- API: ${origin(meta)}/openapi.json\n`;
