// Hono middleware: always verify the Poppy-Session; for scoped routes also require a signed-in token
// with those scopes (Authlete introspection). The token may be a plain `Bearer` or a DPoP-bound
// `DPoP` token (RFC 9449) - Authlete validates the proof. Sets `user` (pairwise User ID) on the context.
import type { MiddlewareHandler } from "hono";
import { ISSUER, SUPPORTED_VERSIONS } from "../config.js";
import { introspect } from "./introspect.js";
import { PoppySessionError, verifyPoppySession } from "./session.js";
import { origin, type CompanyMeta, type Env } from "./types.js";

// The access token follows the scheme: `Bearer` (RFC 6750) or `DPoP` (RFC 9449).
const accessToken = (h?: string) => {
  const m = h ? /^(?:bearer|dpop)\s+(.+)$/i.exec(h) : null;
  return m ? m[1] : undefined;
};

export function guardFor(meta: CompanyMeta) {
  const base = origin(meta);
  return (requiredScopes: string[] = []): MiddlewareHandler<Env> =>
    async (c, next) => {
      // 0.4 adds a Poppy-Version header; 0.3 agents omit it. Only reject an unsupported one.
      const version = c.req.header("poppy-version");
      if (version && !SUPPORTED_VERSIONS.includes(version))
        return c.json({ error: "version_unsupported", supported: SUPPORTED_VERSIONS }, 400);

      const sessionJwt = c.req.header("poppy-session");
      if (!sessionJwt)
        return c.json(
          { error: "invalid_session", error_description: "Send a Poppy-Session header." },
          400,
        );

      const token = accessToken(c.req.header("authorization"));
      let session;
      try {
        session = await verifyPoppySession({
          sessionJwt,
          method: c.req.method,
          url: base + new URL(c.req.url).pathname,
          companyId: ISSUER,
          accessToken: token,
        });
      } catch (e) {
        const error = e instanceof PoppySessionError ? e.error : "invalid_session";
        return c.json({ error, error_description: String((e as Error).message) }, 400);
      }

      if (requiredScopes.length > 0) {
        const scope = requiredScopes.join(" ");
        const prm = `${base}/.well-known/oauth-protected-resource`;
        if (!token)
          return c.json({ error: "invalid_token", scope }, 401, {
            "www-authenticate": `Bearer resource_metadata="${prm}", scope="${scope}"`,
          });

        const url = new URL(c.req.url);
        const intro = await introspect({
          token,
          method: c.req.method,
          htu: base + url.pathname,
          targetUri: base + url.pathname + url.search,
          headers: [...c.req.raw.headers].map(([key, value]) => ({ key, value })),
          dpop: c.req.header("dpop"),
          requestBodyContained: !["GET", "HEAD"].includes(c.req.method),
          requiredScopes,
        });
        if (!intro.active) {
          // Echo Authlete's challenge (correct scheme + params for Bearer or DPoP) plus the RFC 9728
          // pointer, and the DPoP nonce when Authlete asks the client to retry with one.
          const headers: Record<string, string> = {
            "www-authenticate": intro.challenge
              ? `${intro.challenge}, resource_metadata="${prm}"`
              : `Bearer error="insufficient_scope", scope="${scope}", resource_metadata="${prm}"`,
          };
          if (intro.dpopNonce) headers["dpop-nonce"] = intro.dpopNonce;
          return c.json({ error: "invalid_token", scope }, intro.status, headers);
        }
        c.set("user", intro.subject ?? session.sub);
        c.set("signedIn", true);
      } else {
        c.set("user", session.sub);
        c.set("signedIn", session.signedIn);
      }
      await next();
    };
}
