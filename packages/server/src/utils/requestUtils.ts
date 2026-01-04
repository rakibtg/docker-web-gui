import {
  getCsrfCookieName,
  getHostCsrfCookieName,
  getCsrfTokenFromCookies,
  getCsrfTokenFromHeaders,
  isValidCsrfToken,
} from "../csrf";
import { isTrustedProxyRequest } from "../settings";

export const SESSION_COOKIE_NAME = "session_token";
export const HOST_SESSION_COOKIE_NAME = "__Host-session_token";

export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}

export function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function getHeaderValue(
  header: string | string[] | undefined
): string | undefined {
  if (!header) {
    return undefined;
  }
  return Array.isArray(header) ? header[0] : header;
}

export function isSecureRequest(req: any): boolean {
  if (req.socket?.encrypted) {
    return true;
  }

  const forwardedProto = getHeaderValue(req.headers["x-forwarded-proto"]);
  if (!forwardedProto || !isTrustedProxyRequest(req)) {
    return false;
  }

  const proto = forwardedProto.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}

export function getSessionTokenFromCookies(
  cookies: Record<string, string>
): string | undefined {
  return cookies[HOST_SESSION_COOKIE_NAME] || cookies[SESSION_COOKIE_NAME];
}

export function buildSessionCookie(
  name: string,
  token: string,
  maxAgeSeconds: number,
  secure: boolean
): string {
  let cookie = `${name}=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

export function clearSessionCookie(name: string, secure: boolean): string {
  let cookie = `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
}

export function getCsrfTokenCookieName(secure: boolean): string {
  const useHostCookie =
    secure && isTruthyEnv(process.env.USE_HOST_COOKIE_PREFIX);
  return useHostCookie ? getHostCsrfCookieName() : getCsrfCookieName();
}

export function isCsrfProtectedMethod(method?: string): boolean {
  if (!method) {
    return false;
  }
  return ["POST", "PUT", "DELETE"].includes(method.toUpperCase());
}

export function isValidCsrfRequest(req: any): boolean {
  const cookies = parseCookies(req.headers.cookie || "");
  const cookieToken = getCsrfTokenFromCookies(cookies);
  const headerToken = getCsrfTokenFromHeaders(req.headers);
  return isValidCsrfToken(cookieToken, headerToken);
}

function normalizeOriginValue(origin: string): string | null {
  try {
    return new URL(origin).origin.toLowerCase();
  } catch (error) {
    return null;
  }
}

function getAllowedList(envName: string): string[] {
  const rawValue = process.env[envName];
  if (!rawValue) {
    return [];
  }
  return rawValue
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== "");
}

function getAllowedOrigins(): string[] {
  const rawValue = process.env.ALLOWED_ORIGINS;
  if (!rawValue) {
    return [];
  }

  const entries = rawValue.split(",").map((entry) => entry.trim());
  const normalizedOrigins: string[] = [];

  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    const normalized = normalizeOriginValue(entry);
    if (normalized) {
      normalizedOrigins.push(normalized);
    }
  }

  return normalizedOrigins;
}

function getAllowedHosts(): string[] {
  return getAllowedList("ALLOWED_HOSTS");
}

function getHostnameFromHostHeader(hostHeader: string): string {
  const trimmed = hostHeader.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const endIndex = trimmed.indexOf("]");
    if (endIndex > -1) {
      return trimmed.slice(1, endIndex);
    }
    return trimmed;
  }
  const [hostname] = trimmed.split(":");
  return hostname;
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function isWebSocketOriginAllowed(req: any): boolean {
  const hostHeader = getHeaderValue(req.headers.host);
  const originHeader = getHeaderValue(req.headers.origin);
  const allowedHosts = getAllowedHosts();
  const allowedOrigins = getAllowedOrigins();

  if (allowedHosts.length > 0) {
    if (!hostHeader || !allowedHosts.includes(hostHeader.toLowerCase())) {
      return false;
    }
  }

  if (allowedOrigins.length > 0) {
    if (!originHeader) {
      return false;
    }
    const normalizedOrigin = normalizeOriginValue(originHeader);
    return (
      normalizedOrigin !== null && allowedOrigins.includes(normalizedOrigin)
    );
  }

  if (!originHeader) {
    return isTruthyEnv(process.env.ALLOW_NO_ORIGIN);
  }

  const normalizedOrigin = normalizeOriginValue(originHeader);
  if (!normalizedOrigin || !hostHeader) {
    return false;
  }

  try {
    const originHost = new URL(normalizedOrigin).host.toLowerCase();
    const normalizedHostHeader = hostHeader.toLowerCase();

    if (originHost === normalizedHostHeader) {
      return true;
    }

    const originHostname = getHostnameFromHostHeader(originHost);
    const requestHostname = getHostnameFromHostHeader(normalizedHostHeader);

    if (isLoopbackHost(originHostname) && isLoopbackHost(requestHostname)) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

export function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", reject);
  });
}
