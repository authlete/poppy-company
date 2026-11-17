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
export const poppyJson = (meta: CompanyMeta) => {
  // supported_versions lists the OTHER versions the Company serves, each at that version's document
  // URL; the current one is protocol_version, not repeated here (spec 3.4). Omitted when there are none.
  const others = SUPPORTED_VERSIONS.filter((v) => v !== PROTOCOL_VERSION);
  return {
    protocol_version: PROTOCOL_VERSION,
    ...(others.length > 0
      ? {
          supported_versions: Object.fromEntries(
            others.map((v) => [v, `${origin(meta)}/.well-known/poppy.json`]),
          ),
        }
      : {}),
    organization: { name: meta.name, domain: meta.host },
    auth: {
      issuer: ISSUER,
      scopes: Object.fromEntries(meta.scopes.map((s) => [s.name, s.description])),
      scope_hints: Object.fromEntries(
        meta.scopes.map((s) => [s.name, { changes: s.changes, personal_data: s.personalData }]),
      ),
    },
    apis: [
      { type: "openapi", url: `${origin(meta)}/openapi.json`, description: `${meta.name} API` },
    ],
  };
};
