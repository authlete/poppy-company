// The app: route each request to the company that owns its Host (one host per vertical).
// Add a module by importing it and listing it here.
import { Hono } from "hono";
import type { Company } from "./poppy/company.js";
import { stays } from "./modules/stays.js";

const companies: Company[] = [stays];

const byHost = new Map(companies.map((c) => [c.meta.host, c.app]));

const app = new Hono();
app.all("*", (c) => {
  const host = (c.req.header("host") ?? "").split(":")[0];
  const company = byHost.get(host);
  if (!company)
    return c.json({ error: "unknown_company", host, companies: [...byHost.keys()] }, 404);
  return company.fetch(c.req.raw);
});

export default app;
