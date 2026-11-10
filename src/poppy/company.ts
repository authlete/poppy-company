// A company module = its metadata + its routes. defineCompany wires the discovery docs, the Poppy
// guard, and a generated OpenAPI. Modules declare routes with zod schemas (see modules/stays.ts);
// `protect(scopes)` both enforces a scope and documents it, so scopes live in exactly one place.
import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import { ISSUER } from "../config.js";
import { guardFor } from "./guard.js";
import { poppyJson, protectedResource } from "./metadata.js";
import { origin, type CompanyMeta, type Env } from "./types.js";

export interface Company {
  meta: CompanyMeta;
  app: OpenAPIHono<Env>;
}

/** What a route needs: the guard that enforces it, and the OpenAPI security that documents it. */
export interface Protect {
  middleware: MiddlewareHandler<Env>[];
  security: Array<Record<string, string[]>>;
}

/** Wrap a zod schema as an OpenAPI JSON body/response. */
export const json = <T extends z.ZodType>(schema: T, description = "") => ({
  content: { "application/json": { schema } },
  description,
});

export function defineCompany(
  meta: CompanyMeta,
  routes: (app: OpenAPIHono<Env>, protect: (scopes?: string[]) => Protect) => void,
): Company {
  const app = new OpenAPIHono<Env>();
  const guard = guardFor(meta);

  // Every call carries a Poppy-Session; scoped calls also carry an AS-issued token.
  app.openAPIRegistry.registerComponent("securitySchemes", "poppySession", {
    type: "apiKey",
    in: "header",
    name: "Poppy-Session",
    description: "Per-request Poppy-Session JWT (spec 5.2).",
  });
  app.openAPIRegistry.registerComponent("securitySchemes", "oauth2", {
    type: "oauth2",
    flows: {
      authorizationCode: {
        authorizationUrl: `${ISSUER}/oauth/authorize`,
        tokenUrl: `${ISSUER}/oauth/token`,
        scopes: Object.fromEntries(meta.scopes.map((s) => [s.name, s.description])),
      },
    },
  });

  const protect = (scopes: string[] = []): Protect => ({
    middleware: [guard(scopes)],
    security: scopes.length ? [{ poppySession: [], oauth2: scopes }] : [{ poppySession: [] }],
  });

  // Discovery (open, no Session): poppy.json + RFC 9728 PRM + the root hint.
  app.get("/.well-known/poppy.json", (c) => c.json(poppyJson(meta)));
  app.get("/.well-known/oauth-protected-resource", (c) => c.json(protectedResource(meta)));
  app.get("/", (c) => c.json({ company: meta.name, discovery: "/.well-known/poppy.json" }));

  routes(app, protect);

  // OpenAPI generated from the routes above, served at /openapi.json.
  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: { title: meta.name, version: "1.0" },
    servers: [{ url: origin(meta) }],
  });
  return { meta, app };
}
