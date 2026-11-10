/** Shared types for the Poppy layer and the company modules. */

/** A scope the Company defines, with the hints Poppy shows the User (spec 4.7). */
export interface Scope {
  name: string;
  description: string;
  changes: "none" | "reversible" | "irreversible";
  personalData: boolean;
}

/** A company's own identity for its landing page. This is the company's brand, never Authlete's. */
export interface Brand {
  tagline: string;
  blurb: string;
  primary: string; // brand color (hex)
  bg: string; // page background (hex)
}

/** What a vertical module declares about itself. */
export interface CompanyMeta {
  /** The host this company is served on, e.g. `stays.poppysandbox.dev`. Its RFC 9728 resource identity. */
  host: string;
  /** Human name shown in discovery, e.g. "Stays". */
  name: string;
  scopes: Scope[];
  brand?: Brand;
}

/** Values the Poppy guard puts on the Hono context for route handlers to read. */
export type Env = { Variables: { user: string; signedIn: boolean } };

/** The Company's origin (its RFC 9728 `resource` and the base of its Session-JWT `htu`). */
export const origin = (meta: CompanyMeta) => `https://${meta.host}`;
