// Discovery docs (spec 3): poppy.json + RFC 9728 PRM, built from a module's meta. (The OpenAPI is
// generated from the routes - see company.ts.) Like session.ts, Authlete can emit these later, so
// the Company can delegate discovery too.
import { ISSUER, PROTOCOL_VERSION, SUPPORTED_VERSIONS } from "../config.js";
import { origin, type CompanyMeta } from "./types.js";

/** RFC 9728 protected-resource metadata: binds this resource to its authorization server (the AS). */
export const protectedResource = (meta: CompanyMeta) => ({
  resource: origin(meta),
  authorization_servers: [ISSUER],
});

/** The Company's `poppy.json` (spec 3.1): who it is, its scopes, its issuer, and its API. */
export const poppyJson = (meta: CompanyMeta) => ({
  protocol_version: PROTOCOL_VERSION,
  supported_versions: Object.fromEntries(
    SUPPORTED_VERSIONS.map((v) => [v, `${origin(meta)}/.well-known/poppy.json`]),
  ),
  organization: { name: meta.name, domain: meta.host },
  auth: {
    issuer: ISSUER,
    scopes: Object.fromEntries(meta.scopes.map((s) => [s.name, s.description])),
    scope_hints: Object.fromEntries(
      meta.scopes.map((s) => [s.name, { changes: s.changes, personal_data: s.personalData }]),
    ),
  },
  apis: [{ type: "openapi", url: `${origin(meta)}/openapi.json`, description: `${meta.name} API` }],
});
