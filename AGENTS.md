# Adding a company module

Each vertical is one Company served on one host (a subdomain). A module is one file: its metadata +
its routes. Discovery (`poppy.json`, PRM) and the OpenAPI are wired for you - routes are declared
with zod schemas, so `/openapi.json` is generated and real (schemas + the scope each call needs).

## Add one (e.g. "Food")

1. `src/modules/food.ts`:

   ```ts
   import { createRoute, z } from "@hono/zod-openapi";
   import { defineCompany, json } from "../poppy/company.js";

   const Order = z.object({ id: z.string(), total: z.number() }).openapi("Order");

   export const food = defineCompany(
     {
       host: process.env.FOOD_HOST ?? "food.poppysandbox.dev",
       name: "Food",
       scopes: [
         { name: "orders:read", description: "See your orders.", changes: "none", personalData: true },
         { name: "orders:write", description: "Place an order. Each needs your approval.", changes: "irreversible", personalData: true },
       ],
     },
     (app, protect) => {
       app.openapi(
         createRoute({
           method: "get",
           path: "/menu",
           summary: "Browse the menu.",
           ...protect(), // signed-out: Poppy-Session only
           responses: { 200: json(z.object({ items: z.array(z.string()) }), "The menu.") },
         }),
         (c) => c.json({ items: [] }, 200),
       );

       app.openapi(
         createRoute({
           method: "get",
           path: "/orders",
           summary: "List your orders.",
           ...protect(["orders:read"]), // guards the route AND documents the scope
           responses: { 200: json(z.object({ user: z.string(), orders: z.array(Order) }), "Your orders.") },
         }),
         (c) => c.json({ user: c.get("user"), orders: [] }, 200),
       );
     },
   );
   ```

2. Register it in `src/app.ts`:

   ```ts
   import { food } from "./modules/food.js";
   const companies: Company[] = [stays, food];
   ```

3. Map its host (`food.poppysandbox.dev`) to the Vercel project.

## Rules

- `protect()` → signed-out (Poppy-Session only). `protect(["scope"])` → also requires a signed-in
  token with that scope (`Bearer` or DPoP-bound, validated by Authlete). It returns the guard
  middleware *and* the OpenAPI `security`, so a scope is written in exactly one place.
- Read the User ID in a handler with `c.get("user")`; read a validated body with `c.req.valid("json")`.
- Give `c.json(...)` the status you declared in `responses` (e.g. `, 200`).
- Don't touch `src/poppy/` to add a module - it's the shared Poppy layer (session, introspection,
  discovery, guard). `session.ts` and `metadata.ts` are the seams that become Authlete APIs later.
