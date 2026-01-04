import { parse } from "url";
import logger from "../logger";
import { readFileSync, existsSync } from "fs";
import { getSystemStats } from "../systemStats";
import { authRateLimiter } from "../rateLimiter";
import { join, extname, resolve, sep } from "path";
import { recordAction } from "../audit";
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupById,
} from "../groups";

import { buildCsrfCookie, generateCsrfToken } from "../csrf";

import {
  createSession,
  destroySession,
  isAuthRequired,
  validateSession,
  authenticateUser,
} from "../auth";

import { isIPAllowed, extractClientIP } from "../settings";

import {
  SESSION_COOKIE_NAME,
  HOST_SESSION_COOKIE_NAME,
  parseCookies,
  isSecureRequest,
  getSessionTokenFromCookies,
  buildSessionCookie,
  clearSessionCookie,
  isTruthyEnv,
  getCsrfTokenCookieName,
  isCsrfProtectedMethod,
  isValidCsrfRequest,
  readRequestBody,
} from "../utils/requestUtils";

export async function handleHttpRequest(req: any, res: any): Promise<void> {
  const parsedUrl = parse(req.url || "/", true);
  let pathname = parsedUrl.pathname || "/";

  // Extract client IP for all requests
  const clientIP = extractClientIP(req);

  // Check IP access for all API routes
  if (pathname.startsWith("/api/")) {
    if (!isIPAllowed(clientIP)) {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(403);
      res.end(
        JSON.stringify({
          error: "IP_NOT_ALLOWED",
          message: "Access denied from your IP address",
        })
      );
      return;
    }
  }

  if (pathname.startsWith("/api/") && isCsrfProtectedMethod(req.method)) {
    if (!isValidCsrfRequest(req)) {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(403);
      res.end(
        JSON.stringify({
          error: "CSRF_TOKEN_INVALID",
          message: "Invalid or missing CSRF token",
        })
      );
      return;
    } else {
      console.log("Valid CSRF token received");
    }
  }

  // Handle IP access check endpoint
  if (pathname === "/api/ip-access" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    const allowed = isIPAllowed(clientIP);
    res.writeHead(200);
    res.end(
      JSON.stringify({
        allowed,
        ip: clientIP,
      })
    );
    return;
  }

  if (pathname === "/api/csrf" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const token = generateCsrfToken();
    const secureCookie = isSecureRequest(req);
    const cookieName = getCsrfTokenCookieName(secureCookie);
    res.setHeader(
      "Set-Cookie",
      buildCsrfCookie(cookieName, token, secureCookie)
    );
    res.writeHead(200);
    res.end(JSON.stringify({ csrfToken: token }));
    return;
  }

  // Handle authentication API routes
  if (pathname.startsWith("/api/auth/")) {
    res.setHeader("Content-Type", "application/json");

    if (pathname === "/api/auth/status" && req.method === "GET") {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = getSessionTokenFromCookies(cookies);

      const authRequired = isAuthRequired();
      let isAuthenticated = false;
      let user = null;

      if (authRequired && sessionToken) {
        const session = validateSession(sessionToken);
        if (session) {
          isAuthenticated = true;
          user = { username: session.username };
        }
      } else if (!authRequired) {
        isAuthenticated = true;
      }

      res.writeHead(200);
      res.end(
        JSON.stringify({
          isAuthRequired: authRequired,
          isAuthenticated,
          user,
        })
      );
      return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      try {
        // Check rate limit first
        const rateLimitResult = authRateLimiter.checkLimit(clientIP);
        if (!rateLimitResult.allowed) {
          res.setHeader(
            "Retry-After",
            String(rateLimitResult.retryAfter || 900)
          );
          res.writeHead(429);
          res.end(
            JSON.stringify({
              success: false,
              error: "RATE_LIMIT_EXCEEDED",
              message: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
              retryAfter: rateLimitResult.retryAfter,
            })
          );
          await recordAction("auth_login", {
            status: "rate_limited",
            message: "Login attempt blocked by rate limiter",
            ipAddress: clientIP,
          });
          return;
        }

        const body = await readRequestBody(req);
        const { username, password } = JSON.parse(body);

        if (!isAuthRequired()) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              success: false,
              message: "Authentication not required",
            })
          );
          return;
        }

        if (authenticateUser(username, password)) {
          // Reset rate limit on successful login
          authRateLimiter.recordSuccess(clientIP);
          const session = createSession(username);
          const secureCookie = isSecureRequest(req);
          const useHostCookie =
            secureCookie && isTruthyEnv(process.env.USE_HOST_COOKIE_PREFIX);
          const cookieName = useHostCookie
            ? HOST_SESSION_COOKIE_NAME
            : SESSION_COOKIE_NAME;

          // Set secure HTTP-only cookie
          res.setHeader("Set-Cookie", [
            buildSessionCookie(
              cookieName,
              session.token,
              24 * 60 * 60,
              secureCookie
            ),
          ]);

          await recordAction("auth_login", {
            session,
            status: "success",
            message: "User logged in",
            ipAddress: clientIP,
          });

          res.setHeader(
            "X-RateLimit-Remaining",
            String(rateLimitResult.remaining || 0)
          );
          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              user: { username: session.username },
            })
          );
        } else {
          // Failed login - rate limit still applies
          await recordAction("auth_login", {
            status: "failed",
            message: "Invalid credentials",
            ipAddress: clientIP,
          });
          res.setHeader(
            "X-RateLimit-Remaining",
            String(rateLimitResult.remaining || 0)
          );
          res.writeHead(401);
          res.end(
            JSON.stringify({ success: false, message: "Invalid credentials" })
          );
        }
      } catch (error) {
        await recordAction("auth_login", {
          status: "error",
          message: "Login request failed",
          ipAddress: clientIP,
        });
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "Invalid request" }));
      }
      return;
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = getSessionTokenFromCookies(cookies);
      const session = sessionToken ? validateSession(sessionToken) : null;

      if (sessionToken) {
        destroySession(sessionToken);
      }
      const secureCookie = isSecureRequest(req);
      res.setHeader("Set-Cookie", [
        clearSessionCookie(SESSION_COOKIE_NAME, secureCookie),
        clearSessionCookie(HOST_SESSION_COOKIE_NAME, secureCookie),
      ]);

      await recordAction("auth_logout", {
        session,
        status: "success",
        message: "User logged out",
        ipAddress: clientIP,
      });

      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (pathname === "/api/logs" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");

    if (isAuthRequired()) {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = getSessionTokenFromCookies(cookies);
      const session = sessionToken ? validateSession(sessionToken) : null;

      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "AUTH_REQUIRED" }));
        return;
      }
    }

    const {
      limit,
      offset,
      action,
      status,
      userId,
      username,
      ip,
      anonymous,
      page,
    } = parsedUrl.query;
    const parsedLimit = typeof limit === "string" ? Number(limit) : undefined;
    const parsedOffset =
      typeof offset === "string" ? Number(offset) : undefined;
    const parsedPage = typeof page === "string" ? Number(page) : undefined;
    const effectiveLimit: number = Number.isFinite(parsedLimit)
      ? Number(parsedLimit)
      : 20;
    const effectiveOffset: number =
      Number.isFinite(parsedOffset) && parsedOffset !== undefined
        ? Number(parsedOffset)
        : Math.max(
            (Number.isFinite(parsedPage) ? (parsedPage as number) - 1 : 0) *
              effectiveLimit,
            0
          );

    try {
      const { logs, total } = await logger.getLogs({
        action: typeof action === "string" ? action : undefined,
        status: typeof status === "string" ? status : undefined,
        userId: typeof userId === "string" ? userId : undefined,
        username: typeof username === "string" ? username : undefined,
        ipAddress: typeof ip === "string" ? ip : undefined,
        isAnonymous:
          typeof anonymous === "string"
            ? anonymous === "true" || anonymous === "1"
              ? true
              : anonymous === "false" || anonymous === "0"
              ? false
              : undefined
            : undefined,
        limit: effectiveLimit,
        offset: effectiveOffset,
      });

      res.writeHead(200);
      res.end(
        JSON.stringify({
          data: logs,
          meta: {
            total,
            page:
              parsedPage && parsedPage > 0
                ? parsedPage
                : Math.floor(effectiveOffset / effectiveLimit) + 1,
            pageSize: effectiveLimit,
          },
        })
      );
    } catch (error) {
      res.writeHead(500);
      res.end(
        JSON.stringify({
          error: "LOGS_FETCH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to fetch logs at this time",
        })
      );
    }
    return;
  }

  if (pathname === "/api/groups" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");

    if (isAuthRequired()) {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = getSessionTokenFromCookies(cookies);
      const session = sessionToken ? validateSession(sessionToken) : null;

      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "AUTH_REQUIRED" }));
        return;
      }
    }

    try {
      const groups = await listGroups();
      res.writeHead(200);
      res.end(JSON.stringify({ data: groups }));
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "GROUPS_FETCH_FAILED" }));
    }
    return;
  }

  if (pathname === "/api/groups" && req.method === "POST") {
    res.setHeader("Content-Type", "application/json");

    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = getSessionTokenFromCookies(cookies);
    const session = sessionToken ? validateSession(sessionToken) : null;

    if (isAuthRequired() && !session) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "AUTH_REQUIRED" }));
      return;
    }

    try {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body);
      const name = typeof payload?.name === "string" ? payload.name.trim() : "";
      const containerIds = Array.isArray(payload?.containerIds)
        ? payload.containerIds.filter((id: unknown) => typeof id === "string")
        : [];

      if (!name) {
        res.writeHead(400);
        res.end(
          JSON.stringify({ error: "INVALID_REQUEST", message: "Name required" })
        );
        return;
      }

      const group = await createGroup(name, containerIds);
      res.writeHead(201);
      res.end(JSON.stringify({ data: group }));

      await recordAction("group_create", {
        session,
        ipAddress: clientIP,
        resourceType: "group",
        resourceId: String(group.id),
        status: "success",
        message: `Group "${group.name}" created`,
        metadata: {
          containerCount: group.containerIds.length,
        },
      });
    } catch (error: any) {
      const message = error?.message || "Failed to create group";
      const isConstraint =
        typeof message === "string" && message.toLowerCase().includes("unique");
      const isSyntaxError = error instanceof SyntaxError;
      res.writeHead(isSyntaxError ? 400 : isConstraint ? 409 : 500);
      res.end(
        JSON.stringify({
          error: isConstraint
            ? "GROUP_NAME_EXISTS"
            : isSyntaxError
            ? "INVALID_REQUEST"
            : "GROUP_CREATE_FAILED",
          message,
        })
      );

      await recordAction("group_create", {
        session,
        ipAddress: clientIP,
        resourceType: "group",
        status: "error",
        message,
      });
    }
    return;
  }

  if (pathname.startsWith("/api/groups/")) {
    res.setHeader("Content-Type", "application/json");

    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = getSessionTokenFromCookies(cookies);
    const session = sessionToken ? validateSession(sessionToken) : null;

    if (isAuthRequired() && !session) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "AUTH_REQUIRED" }));
      return;
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const idSegment = pathSegments[2];
    const groupId = Number(idSegment);
    if (!idSegment || !Number.isFinite(groupId) || groupId <= 0) {
      res.writeHead(400);
      res.end(
        JSON.stringify({ error: "INVALID_REQUEST", message: "Invalid group" })
      );
      return;
    }

    if (pathSegments[3] === "actions" && req.method === "POST") {
      try {
        const body = await readRequestBody(req);
        const payload = JSON.parse(body);
        const action =
          typeof payload?.action === "string"
            ? payload.action.trim().toLowerCase()
            : "";
        const containerIds = Array.isArray(payload?.containerIds)
          ? payload.containerIds.filter((id: unknown) => typeof id === "string")
          : [];

        if (!["start", "stop", "restart"].includes(action)) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "Invalid group action",
            })
          );
          return;
        }

        const group = await getGroupById(groupId);
        if (!group) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "GROUP_NOT_FOUND" }));
          return;
        }

        await recordAction(`group_${action}`, {
          session,
          ipAddress: clientIP,
          resourceType: "group",
          resourceId: String(groupId),
          status: "requested",
          message: `Group "${group.name}" ${action} requested`,
          metadata: {
            containerCount: containerIds.length || group.containerIds.length,
            containerIds:
              containerIds.length > 0 ? containerIds : group.containerIds,
          },
        });

        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (error: any) {
        const message = error?.message || "Failed to log group action";
        res.writeHead(500);
        res.end(JSON.stringify({ error: "GROUP_ACTION_LOG_FAILED", message }));
      }
      return;
    }

    if (req.method === "PUT") {
      try {
        const body = await readRequestBody(req);
        const payload = JSON.parse(body);
        const name =
          typeof payload?.name === "string" ? payload.name.trim() : "";
        const containerIds = Array.isArray(payload?.containerIds)
          ? payload.containerIds.filter((id: unknown) => typeof id === "string")
          : [];

        if (!name) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: "INVALID_REQUEST",
              message: "Name required",
            })
          );
          return;
        }

        const group = await updateGroup(groupId, name, containerIds);
        if (!group) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "GROUP_NOT_FOUND" }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ data: group }));

        await recordAction("group_update", {
          session,
          ipAddress: clientIP,
          resourceType: "group",
          resourceId: String(group.id),
          status: "success",
          message: `Group "${group.name}" updated`,
          metadata: {
            containerCount: group.containerIds.length,
          },
        });
      } catch (error: any) {
        const message = error?.message || "Failed to update group";
        const isConstraint =
          typeof message === "string" &&
          message.toLowerCase().includes("unique");
        const isSyntaxError = error instanceof SyntaxError;
        res.writeHead(isSyntaxError ? 400 : isConstraint ? 409 : 500);
        res.end(
          JSON.stringify({
            error: isConstraint
              ? "GROUP_NAME_EXISTS"
              : isSyntaxError
              ? "INVALID_REQUEST"
              : "GROUP_UPDATE_FAILED",
            message,
          })
        );

        await recordAction("group_update", {
          session,
          ipAddress: clientIP,
          resourceType: "group",
          resourceId: String(groupId),
          status: "error",
          message,
        });
      }
      return;
    }

    if (req.method === "DELETE") {
      try {
        const deleted = await deleteGroup(groupId);
        if (!deleted) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "GROUP_NOT_FOUND" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));

        await recordAction("group_delete", {
          session,
          ipAddress: clientIP,
          resourceType: "group",
          resourceId: String(groupId),
          status: "success",
          message: "Group deleted",
        });
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "GROUP_DELETE_FAILED" }));

        await recordAction("group_delete", {
          session,
          ipAddress: clientIP,
          resourceType: "group",
          resourceId: String(groupId),
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to delete group",
        });
      }
      return;
    }
  }

  if (pathname === "/api/system-stats" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");

    if (isAuthRequired()) {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = getSessionTokenFromCookies(cookies);
      const session = sessionToken ? validateSession(sessionToken) : null;

      if (!session) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "AUTH_REQUIRED" }));
        return;
      }
    }

    try {
      const stats = getSystemStats();
      res.writeHead(200);
      res.end(JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to read system stats:", error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Failed to read system stats" }));
    }
    return;
  }

  // Default to index.html for root path
  if (pathname === "/") {
    pathname = "/index.html";
  }

  let decodedPathname = "";
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  // Construct file path safely under public directory
  const publicDir = resolve(__dirname, "../../public");
  const normalizedPath = decodedPathname.replace(/\\/g, "/");
  const safePath = normalizedPath.replace(/^\/+/, "");

  if (safePath.split("/").includes("..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  const filePath = resolve(publicDir, safePath);

  if (!filePath.startsWith(publicDir + sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Check if file exists
  if (existsSync(filePath)) {
    try {
      const data = readFileSync(filePath);
      const ext = extname(filePath).toLowerCase();

      // Set content type based on file extension
      const contentTypes: Record<string, string> = {
        ".css": "text/css",
        ".html": "text/html",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".ico": "image/x-icon",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".js": "application/javascript",
      };

      res.setHeader("Content-Type", contentTypes[ext] || "text/plain");
      res.writeHead(200);
      res.end(data);
    } catch (err) {
      res.writeHead(500);
      res.end("Server Error");
    }
  } else {
    // For SPA routing, serve index.html for non-API routes
    if (!pathname.startsWith("/api") && !pathname.startsWith("/ws")) {
      const indexPath = join(publicDir, "index.html");
      if (existsSync(indexPath)) {
        try {
          const data = readFileSync(indexPath);
          res.setHeader("Content-Type", "text/html");
          res.writeHead(200);
          res.end(data);
        } catch (err) {
          res.writeHead(404);
          res.end("Not Found");
        }
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  }
}
