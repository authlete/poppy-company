// Config from env - the same code runs locally and on Vercel.

// The Authlete-powered AS. Also the Company's identifier (Session JWTs are addressed to it).
export const ISSUER = process.env.POPPY_ISSUER ?? "https://auth.stays.poppysandbox.dev";

export const PROTOCOL_VERSION = "1.0";
export const SUPPORTED_VERSIONS = ["1.0"];

// Session JWT `iat` acceptance window, in seconds (the Company chooses; spec 5.3).
export const IAT_WINDOW_SECONDS = 120;

// The hosted Authlete service this Company delegates to.
export const authlete = {
  baseUrl: process.env.AUTHLETE_BASE ?? "https://us.authlete.com",
  serviceId: process.env.AUTHLETE_SERVICE_ID ?? "",
  token: process.env.AUTHLETE_TOKEN ?? "",
};
