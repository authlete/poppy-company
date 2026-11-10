# poppy-company

A minimal reference Personal Agent Protocol (Poppy) Company, backed by an Authlete-powered
authorization server. One repo, one module per vertical (each on its own subdomain). First module:
Stays.

The point: a Company offloads the protocol to Authlete. Token validation is already an Authlete API
(`src/poppy/introspect.ts`). Poppy-Session verification and discovery (`src/poppy/session.ts`,
`src/poppy/metadata.ts`) are written the same way, so they can become Authlete APIs too - the
Company keeps its routes and hands the protocol to Authlete.

## Layout

- `src/poppy/` - the shared Poppy layer: session verification, token introspection, discovery docs,
  and the `guard` middleware that applies them. You don't touch this to add a company.
- `src/modules/` - one file per company (`stays.ts`). Metadata + routes.
- `src/app.ts` - routes each request to the company that owns its `Host`.
- `src/server.ts` - local dev server. `api/index.ts` - Vercel entry.

See [AGENTS.md](./AGENTS.md) to add a module.

## Run locally

```sh
npm install
npm run dev
```

Set the environment first (see below). A signed-out route:

```sh
curl -H "Host: stays.poppysandbox.dev" http://localhost:4000/rooms
```

## Environment

| Variable | What |
| --- | --- |
| `POPPY_ISSUER` | The Authlete-powered AS, e.g. `https://auth.poppysandbox.dev`. |
| `AUTHLETE_BASE` | Authlete API base, e.g. `https://us.authlete.com`. |
| `AUTHLETE_SERVICE_ID` | The Authlete service backing the AS. |
| `AUTHLETE_TOKEN` | Authlete access token for introspection. |
| `STAYS_HOST` | The Stays host (default `stays.poppysandbox.dev`). |

## Deploy (Vercel)

Set the same variables as Vercel project env, then map each company host (e.g.
`stays.poppysandbox.dev`) to the project. `vercel.json` routes every path to `api/index.ts`.
