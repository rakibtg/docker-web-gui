import { randomBytes, timingSafeEqual } from "crypto";
import { getSettings } from "./settings";

const DEFAULT_CSRF_TOKEN_BYTES = 32;
const DEFAULT_CSRF_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_CSRF_COOKIE_NAME = "csrf_token";
const DEFAULT_HOST_CSRF_COOKIE_NAME = "__Host-csrf_token";

interface ResolvedCsrfConfig {
  tokenBytes: number;
  tokenTtlSeconds: number;
  cookieName: string;
  hostCookieName: string;
}

function resolveCsrfConfig(): ResolvedCsrfConfig {
  const settings = getSettings();
  const csrf = settings.csrf;

  const tokenBytes =
    typeof csrf?.token_bytes === "number" && csrf.token_bytes > 0
      ? Math.floor(csrf.token_bytes)
      : DEFAULT_CSRF_TOKEN_BYTES;
  const tokenTtlSeconds =
    typeof csrf?.token_ttl_seconds === "number" && csrf.token_ttl_seconds > 0
      ? Math.floor(csrf.token_ttl_seconds)
      : DEFAULT_CSRF_TOKEN_TTL_SECONDS;
  const cookieName =
    typeof csrf?.cookie_name === "string" && csrf.cookie_name.trim() !== ""
      ? csrf.cookie_name.trim()
      : DEFAULT_CSRF_COOKIE_NAME;
  const hostCookieName =
    typeof csrf?.host_cookie_name === "string" &&
    csrf.host_cookie_name.trim() !== ""
      ? csrf.host_cookie_name.trim()
      : DEFAULT_HOST_CSRF_COOKIE_NAME;

  return {
    tokenBytes,
    tokenTtlSeconds,
    cookieName,
    hostCookieName,
  };
}

export function getCsrfCookieName(): string {
  return resolveCsrfConfig().cookieName;
}

export function getHostCsrfCookieName(): string {
  return resolveCsrfConfig().hostCookieName;
}

export function generateCsrfToken(): string {
  const { tokenBytes } = resolveCsrfConfig();
  return randomBytes(tokenBytes).toString("hex");
}

export function buildCsrfCookie(
  name: string,
  token: string,
  secure: boolean
): string {
  const { tokenTtlSeconds } = resolveCsrfConfig();
  let cookie = `${name}=${token}; Path=/; SameSite=Strict; Max-Age=${tokenTtlSeconds}; HttpOnly`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

export function getCsrfTokenFromCookies(
  cookies: Record<string, string>
): string | undefined {
  const { cookieName, hostCookieName } = resolveCsrfConfig();
  return cookies[hostCookieName] || cookies[cookieName];
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
