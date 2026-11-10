// Token validation, delegated to Authlete. The Company never validates tokens itself - and when the
// token is sender-constrained with DPoP (RFC 9449), Authlete validates the proof too, from the
// forwarded `dpop`/`htm`/`htu`.
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { authlete } from "../config.js";

export interface IntrospectInput {
  /** The access token, from a `Bearer` or `DPoP` Authorization header. */
  token: string;
  method: string;
  /** Resource URL without query - Authlete's DPoP `htu`. */
  htu: string;
  /** Resource URL with query - the signed `@target-uri`. */
  targetUri: string;
  headers: Array<{ key: string; value: string }>;
  /** The `DPoP` proof header, when the request carries one. */
  dpop?: string;
  requestBodyContained: boolean;
  requiredScopes: string[];
}

export interface Introspection {
  /** True only when the token is valid, covers the scopes, and (if DPoP) the proof checks out. */
  active: boolean;
  subject?: string;
  scopes: string[];
  /** HTTP status to return on failure, from Authlete's `action`. */
  status: ContentfulStatusCode;
  /** Ready-made `WWW-Authenticate` challenge - the right scheme (Bearer or DPoP) and params. */
  challenge?: string;
  /** Nonce to echo in `DPoP-Nonce` when Authlete requires one. */
  dpopNonce?: string;
}

// Authlete returns an `action`, not an HTTP status. OK = valid; anything unlisted = 401.
const STATUS: Record<string, ContentfulStatusCode> = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
};

/** Ask Authlete whether `token` is active, covers `requiredScopes`, and carries a valid DPoP proof. */
export async function introspect(input: IntrospectInput): Promise<Introspection> {
  const res = await fetch(`${authlete.baseUrl}/api/${authlete.serviceId}/auth/introspection`, {
    method: "POST",
    headers: { authorization: `Bearer ${authlete.token}`, "content-type": "application/json" },
    body: JSON.stringify({
      token: input.token,
      scopes: input.requiredScopes,
      htm: input.method,
      htu: input.htu,
      targetUri: input.targetUri,
      headers: input.headers,
      dpop: input.dpop,
      requestBodyContained: input.requestBodyContained,
    }),
  });
  const data = (await res.json()) as {
    action?: string;
    subject?: string;
    scopes?: string[];
    responseContent?: string;
    dpopNonce?: string;
  };
  return {
    active: data.action === "OK",
    subject: data.subject,
    scopes: data.scopes ?? [],
    status: STATUS[data.action ?? ""] ?? 401,
    challenge: data.responseContent,
    dpopNonce: data.dpopNonce,
  };
}
