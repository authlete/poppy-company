// Vercel entry. Bridges Vercel's Node (req, res) to Hono.
import { handle } from "@hono/node-server/vercel";
import app from "../src/app.js";

export const runtime = "nodejs";
export default handle(app);
