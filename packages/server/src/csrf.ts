import { randomBytes, timingSafeEqual } from "crypto";

const CSRF_TOKEN_BYTES = 32;
const CSRF_TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const CSRF_COOKIE_NAME = "csrf_token";
export const HOST_CSRF_COOKIE_NAME = "__Host-csrf_token";

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

export function buildCsrfCookie(
  name: string,
  token: string,
  secure: boolean
): string {
  let cookie = `${name}=${token}; Path=/; SameSite=Strict; Max-Age=${CSRF_TOKEN_TTL_SECONDS}; HttpOnly`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

export function getCsrfTokenFromCookies(
  cookies: Record<string, string>
): string | undefined {
  return cookies[HOST_CSRF_COOKIE_NAME] || cookies[CSRF_COOKIE_NAME];
}

export function getCsrfTokenFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const headerValue = headers["x-csrf-token"] ?? headers["x-xsrf-token"];
  if (!headerValue) {
    return undefined;
  }
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}

export function isValidCsrfToken(
  cookieToken?: string,
  headerToken?: string
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }
  if (cookieToken.length !== headerToken.length) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}
