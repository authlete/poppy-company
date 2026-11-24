// The app: route each request to the company that owns its Host (one host per vertical).
// Add a module by importing it and listing it here.
import { Hono } from "hono";
import { log } from "./log.js";
import type { Company } from "./poppy/company.js";
import { stays } from "./modules/stays.js";

const companies: Company[] = [stays];

const byHost = new Map(companies.map((c) => [c.meta.host, c.app]));

const app = new Hono();

// One line per request so we can see what an agent does (visible in Vercel runtime logs). Set
// LOG_LEVEL=warn to silence these. Credentials are never logged - only whether one was present.
app.use("*", async (c, next) => {
  const started = Date.now();
  await next();
  log.info("request", {
    method: c.req.method,
    host: (c.req.header("host") ?? "").split(":")[0],
    path: c.req.path,
    status: c.res.status,
    ua: c.req.header("user-agent"),
    accept: c.req.header("accept"),
    session: Boolean(c.req.header("poppy-session")),
    token: Boolean(c.req.header("authorization")),
    ms: Date.now() - started,
  });
});

app.all("*", (c) => {
  const host = (c.req.header("host") ?? "").split(":")[0];
  const company = byHost.get(host);
  if (!company)
    return c.json({ error: "unknown_company", host, companies: [...byHost.keys()] }, 404);
  return company.fetch(c.req.raw);
});

export default app;
