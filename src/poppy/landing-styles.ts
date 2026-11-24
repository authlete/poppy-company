// The landing page's CSS, kept out of landing.ts so the markup reads cleanly. Brand colours come
// from the Company's own palette (meta.brand).
import type { Brand } from "./types.js";

export const landingStyles = (
  brand: Brand,
) => `  :root{--brand:${brand.primary};--bg:${brand.bg};--ink:#1c1917;--muted:#78716c;--line:#e8e1d6;--surface:#fff}
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
  .rooms-sec{border-top:1px solid var(--line)}
  .rooms-sec .wrap{padding:56px 24px}
  .rooms-sec h2{font-family:"Iowan Old Style",Georgia,serif;font-size:30px;margin:0 0 6px;color:var(--ink)}
  .rooms-sec .note{color:var(--muted);margin:0 0 26px}
  .rooms{display:grid;gap:14px;grid-template-columns:1fr}
  @media(min-width:720px){.rooms{grid-template-columns:repeat(3,1fr)}}
  .room{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:14px;padding:22px;background:var(--surface)}
  .room-name{font-size:21px;color:var(--ink)}
  .room-detail{color:var(--muted);font-size:14px}
  .room-note{margin-top:4px;color:var(--brand);font-weight:600}
  footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px}
  footer .wrap{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:26px 24px}`;
