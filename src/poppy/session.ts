// Verify a Poppy-Session header (spec 5.2/5.3): the delegation chain + the per-request Session JWT.
// Runs locally today; this is the seam that becomes an Authlete API later (like `introspect`), so a
// Company can delegate it too.

import { createHash } from "node:crypto";
import {
  calculateJwkThumbprint,
  decodeJwt,
  decodeProtectedHeader,
  importJWK,
  jwtVerify,
} from "jose";
import { IAT_WINDOW_SECONDS } from "../config.js";

export class PoppySessionError extends Error {
  constructor(
    message: string,
    readonly error: "invalid_session" | "session_ended" = "invalid_session",
  ) {
    super(message);
  }
}

export interface VerifiedSession {
  clientId: string;
  sid: string;
  sub: string; // pairwise User ID
  agentId?: string;
  signedIn: boolean;
}

export interface VerifyInput {
  sessionJwt: string;
  method: string;
  url: string;
  /** The Company identifier the Session JWT must be addressed to: its issuer. */
  companyId: string;
  /** Present when the request also carries an access token (signed in). */
  accessToken?: string;
}

const PRIVATE_JWK_MEMBERS = ["d", "p", "q", "dp", "dq", "qi", "oth", "k"];
const b64urlSha256 = (s: string) => createHash("sha256").update(s).digest("base64url");
const isPublic = (k: Record<string, unknown>) => PRIVATE_JWK_MEMBERS.every((m) => !(m in k));

/** Fetch the agent's CIMD and return its public keys (inline `jwks` or same-origin `jwks_uri`). */
async function fetchClientKeys(clientId: string): Promise<any[]> {
  const u = new URL(clientId);
  const res = await fetch(clientId, {
    redirect: "manual",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new PoppySessionError(`client metadata fetch failed (${res.status})`);
  const metadata = (await res.json()) as any;
  if (metadata.client_id !== clientId)
    throw new PoppySessionError("client_id mismatch in metadata");

  let keys: any[] | undefined;
  if (metadata.jwks_uri) {
    if (new URL(metadata.jwks_uri).origin !== u.origin)
      throw new PoppySessionError("jwks_uri must share the client_id origin");
    const jr = await fetch(metadata.jwks_uri, {
      redirect: "manual",
      headers: { accept: "application/json" },
    });
    if (!jr.ok) throw new PoppySessionError("jwks_uri fetch failed");
    keys = ((await jr.json()) as any).keys;
  } else if (metadata.jwks?.keys) {
    keys = metadata.jwks.keys;
  }
  if (!Array.isArray(keys) || keys.length === 0) throw new PoppySessionError("client has no keys");
  if (!keys.every(isPublic)) throw new PoppySessionError("client jwks must be public only");
  return keys;
}

/** Verify the delegation (carried in the Session JWT's `poppy_dlg` header) and return its delegated key. */
async function verifyDelegation(dlg: string, clientId: string, keys: any[]): Promise<any> {
  const header = decodeProtectedHeader(dlg) as any;
  if (header.typ !== "poppy-delegation+jwt") throw new PoppySessionError("bad delegation typ");
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new PoppySessionError("delegation kid not in client jwks");
  const alg = jwk.alg ?? (jwk.kty === "RSA" ? "PS384" : "ES256");
  const { payload } = await jwtVerify(dlg, await importJWK(jwk, alg), {
    typ: "poppy-delegation+jwt",
  });
  if (payload.iss !== clientId) throw new PoppySessionError("delegation iss != client_id");
  const iat = payload.iat ?? 0;
  const exp = payload.exp ?? 0;
  if (!exp || exp <= Math.floor(Date.now() / 1000))
    throw new PoppySessionError("delegation expired");
  if (exp - iat > 24 * 3600 + 5) throw new PoppySessionError("delegation lifetime > 24h");
  const cnf = (payload as any).cnf?.jwk;
  if (!cnf) throw new PoppySessionError("delegation has no cnf.jwk");
  if (!isPublic(cnf)) throw new PoppySessionError("cnf.jwk has private members");
  // A delegation is inert: it names no User, Agent, or Company (spec 5.2).
  for (const forbidden of ["sub", "aud", "agent_id"])
    if (forbidden in (payload as any))
      throw new PoppySessionError(`delegation must not contain ${forbidden}`);
  return cnf;
}

/** Verify a `Poppy-Session` header. Throws PoppySessionError on any failure. */
export async function verifyPoppySession(input: VerifyInput): Promise<VerifiedSession> {
  const header = decodeProtectedHeader(input.sessionJwt) as any;
  if (header.typ !== "poppy-session+jwt") throw new PoppySessionError("bad session typ");
  if (header.alg !== "ES256") throw new PoppySessionError("session alg must be ES256");
  if (!header.poppy_dlg) throw new PoppySessionError("session JWT has no poppy_dlg delegation");

  // `iss` locates the agent's keys; the signature check below makes it trustworthy.
  const clientId = String(decodeJwt(input.sessionJwt).iss ?? "");
  if (!clientId) throw new PoppySessionError("session has no iss");

  const keys = await fetchClientKeys(clientId);
  const cnfJwk = await verifyDelegation(header.poppy_dlg, clientId, keys);

  // The Session JWT is signed by the delegated key; its kid must be that key's thumbprint.
  if (header.kid !== (await calculateJwkThumbprint(cnfJwk)))
    throw new PoppySessionError("session kid != delegated key thumbprint");

  const { payload } = await jwtVerify(input.sessionJwt, await importJWK(cnfJwk, "ES256"), {
    typ: "poppy-session+jwt",
    audience: input.companyId,
  });

  const htu = input.url.split(/[?#]/)[0];
  if (payload.htm !== input.method) throw new PoppySessionError("htm mismatch");
  if (payload.htu !== htu) throw new PoppySessionError(`htu mismatch (${payload.htu} != ${htu})`);
  if (Math.abs(Math.floor(Date.now() / 1000) - (payload.iat ?? 0)) > IAT_WINDOW_SECONDS)
    throw new PoppySessionError("iat outside window");
  if (!payload.jti) throw new PoppySessionError("session has no jti");
  const sid = (payload as any).sid;
  if (!sid) throw new PoppySessionError("session has no sid");
  if (!payload.sub) throw new PoppySessionError("session has no sub");

  const ath = (payload as any).ath;
  if (input.accessToken) {
    if (ath !== b64urlSha256(input.accessToken))
      throw new PoppySessionError("ath does not match access token");
  } else if (ath !== undefined) {
    throw new PoppySessionError("ath present without an access token");
  }

  return {
    clientId,
    sid: String(sid),
    sub: String(payload.sub),
    agentId: (payload as any).agent_id,
    signedIn: !!input.accessToken,
  };
}
