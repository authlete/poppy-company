// Vercel entry. vercel.json rewrites every path here; Hono routes it.
import { handle } from "@hono/vercel";
import app from "../src/app.js";

export const runtime = "nodejs";
export default handle(app);
