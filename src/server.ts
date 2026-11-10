// Local dev server. On Vercel the app is served by api/index.ts instead.
import { serve } from "@hono/node-server";
import app from "./app.js";

const port = Number(process.env.PORT ?? 4000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`poppy-company listening on http://localhost:${info.port}`);
});
