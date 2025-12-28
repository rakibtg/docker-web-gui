import { parse } from "url";
import logger from "./logger";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { readFileSync, existsSync } from "fs";
import { join, extname, resolve, sep } from "path";
import { initializeDatabase } from "./db/connection";
import { DockerService, ContainerWithStats } from "./dockerService";
import { getSystemStats } from "./systemStats";

import {
  AuthSession,
  createSession,
  destroySession,
  isAuthRequired,
  validateSession,
  authenticateUser,
} from "./auth";

import {
  isIPAllowed,
  extractClientIP,
  getSettings,
  isTrustedProxyRequest,
} from "./settings";

// Client management for WebSocket connections
interface ClientConnection {
  ws: any;
  id: string;
  lastPing: number;
  isActive: boolean;
  session?: AuthSession;
  sessionToken?: string;
  terminals?: Map<string, any>; // terminalId -> terminal process
}

const clients = new Map<string, ClientConnection>();
const dockerService = new DockerService();

// Generate unique client ID
function generateClientId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Clean up inactive clients
function cleanupInactiveClients(): void {
  const now = Date.now();
  for (const [clientId, client] of clients.entries()) {
    if (now - client.lastPing > 30000) {
      // 30 seconds timeout
      console.log(`Removing inactive client: ${clientId}`);
      clients.delete(clientId);
    }
  }

  // Stop stats streaming if no active clients
  if (clients.size === 0 && dockerService.isStatsStreaming()) {
    console.log("No active clients, stopping stats streaming");
    dockerService.stopStatsStreaming();
  }
}

// Broadcast stats to all active clients
function broadcastStats(containerWithStats: ContainerWithStats): void {
  const message = JSON.stringify({
    type: "container-stats",
    data: containerWithStats,
    timestamp: new Date().toISOString(),
  });

  for (const [clientId, client] of clients.entries()) {
    if (client.isActive && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to send stats to client ${clientId}:`, error);
        client.isActive = false;
      }
    }
  }
}

// Broadcast message to all active clients
function broadcastToAllClients(message: object): void {
  const messageStr = JSON.stringify(message);

  for (const [clientId, client] of clients.entries()) {
    if (client.isActive && client.ws.readyState === 1) {
      try {
        client.ws.send(messageStr);
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        client.isActive = false;
      }
    }
  }
}

interface LogContext {
  userId: string | null;
  username: string | null;
  isAnonymous: boolean;
}

function createLogContext(session?: AuthSession | null): LogContext {
  if (session) {
    return {
      userId: session.userId || session.username,
      username: session.username,
      isAnonymous: false,
    };
  }
  return {
    userId: null,
    username: null,
    isAnonymous: true,
  };
}

async function recordAction(
  action: string,
  options: {
    message?: string;
    status?: string;
    metadata?: Record<string, any>;
    session?: AuthSession | null;
    ipAddress?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
  } = {}
): Promise<void> {
  const context = createLogContext(options.session);
  try {
    await logger.logAction({
      action,
      message: options.message ?? null,
      status: options.status ?? null,
      metadata: options.metadata ?? null,
      userId: context.userId,
      username: context.username,
      isAnonymous: context.isAnonymous,
      ipAddress: options.ipAddress ?? null,
      resourceType: options.resourceType ?? null,
      resourceId: options.resourceId ?? null,
    });
  } catch (error) {
    console.warn("Failed to log action:", error);
  }
}

// Set up Docker service event listeners
dockerService.on("stats", (containerWithStats: ContainerWithStats) => {
  broadcastStats(containerWithStats);
});

dockerService.on("error", (error: Error) => {
  console.error("Docker service error:", error);
  const errorMessage = JSON.stringify({
    type: "error",
    message: error.message,
    timestamp: new Date().toISOString(),
  });

  for (const [, client] of clients.entries()) {
    if (client.isActive && client.ws.readyState === 1) {
      try {
        client.ws.send(errorMessage);
      } catch (err) {
        console.error("Failed to send error to client:", err);
      }
    }
  }
});

// Clean up inactive clients every 30 seconds
setInterval(cleanupInactiveClients, 30000);

// Helper function to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
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

const SESSION_COOKIE_NAME = "session_token";
const HOST_SESSION_COOKIE_NAME = "__Host-session_token";

function isTruthyEnv(value: string | undefined): boolean {
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

function isSecureRequest(req: any): boolean {
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

function getSessionTokenFromCookies(
  cookies: Record<string, string>
): string | undefined {
  return cookies[HOST_SESSION_COOKIE_NAME] || cookies[SESSION_COOKIE_NAME];
}

function buildSessionCookie(
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

function clearSessionCookie(name: string, secure: boolean): string {
  let cookie = `${name}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
  if (secure) {
    cookie += "; Secure";
  }
  return cookie;
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

function isWebSocketOriginAllowed(req: any): boolean {
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

// Helper function to read request body
function readRequestBody(req: any): Promise<string> {
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

// Create HTTP server
const server = createServer(async (req, res) => {
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

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              user: { username: session.username },
            })
          );
        } else {
          await recordAction("auth_login", {
            status: "failed",
            message: "Invalid credentials",
            ipAddress: clientIP,
          });
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
  const publicDir = resolve(__dirname, "../public");
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
});

async function startServer() {
  try {
    await initializeDatabase();
    const users = getSettings("users");
    if (isAuthRequired() && (!users || users.length === 0)) {
      throw new Error(
        "Authentication is enabled but no users are configured. Please set users in .settings.json."
      );
    }

    const bindHost = process.env.BIND_HOST || "127.0.0.1";
    server.listen(8080, bindHost, () => {
      console.log(`HTTP server running on ${bindHost}:8080`);
      console.log(`WebSocket server running on ${bindHost}:8080`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Create WebSocket server using the HTTP server
const wss = new WebSocketServer({ server });

wss.on("connection", function connection(ws, req) {
  const clientId = generateClientId();
  const clientIP = extractClientIP(req);

  console.log(`New client connected: ${clientId} from IP: ${clientIP}`);

  if (!isWebSocketOriginAllowed(req)) {
    console.log(`WebSocket origin denied for client: ${clientId}`);
    ws.close(1008, "Origin not allowed");
    return;
  }

  // Check IP access first
  if (!isIPAllowed(clientIP)) {
    console.log(`IP access denied for client: ${clientId} (IP: ${clientIP})`);
    ws.close(1008, "IP_NOT_ALLOWED");
    return;
  }

  // Check authentication if required
  const cookies = parseCookies(req.headers.cookie || "");
  const sessionToken = getSessionTokenFromCookies(cookies);
  let session: AuthSession | undefined = undefined;
  if (isAuthRequired()) {
    if (!sessionToken) {
      console.log(`Unauthenticated connection attempt: ${clientId}`);
      ws.close(1008, "Authentication required");
      return;
    }

    const validatedSession = validateSession(sessionToken);
    if (!validatedSession) {
      console.log(`Invalid session for client: ${clientId}`);
      ws.close(1008, "Invalid session");
      return;
    }

    session = validatedSession;

    console.log(
      `Authenticated client connected: ${clientId} (user: ${session.username})`
    );
  }

  // Register client
  const client: ClientConnection = {
    ws,
    session,
    sessionToken,
    id: clientId,
    isActive: true,
    lastPing: Date.now(),
    terminals: new Map(),
  };
  clients.set(clientId, client);

  // Send initial Docker availability status
  dockerService.checkDockerAvailability().then((result) => {
    if (client.isActive && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: "docker-status",
          available: result.available,
          message: result.message,
          clientId: clientId,
        })
      );
    }
  });

  const unauthenticatedMessageTypes = new Set(["ping"]);

  function getValidatedSession(authRequired: boolean): AuthSession | null {
    if (!authRequired) {
      return client.session ?? null;
    }
    if (!client.sessionToken) {
      client.session = undefined;
      return null;
    }

    const validatedSession = validateSession(client.sessionToken);
    if (!validatedSession) {
      client.session = undefined;
      return null;
    }

    client.session = validatedSession;
    return validatedSession;
  }

  ws.on("message", async function message(data) {
    if (!client.isActive) return;

    client.lastPing = Date.now();

    try {
      const parsedMessage = JSON.parse(data.toString());

      const authRequired = isAuthRequired();
      const currentSession = getValidatedSession(authRequired);
      const isAllowedWithoutAuth = unauthenticatedMessageTypes.has(
        parsedMessage.type
      );

      if (authRequired && !currentSession) {
        if (isAllowedWithoutAuth && parsedMessage.type === "ping") {
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
              clientId: clientId,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "AUTH_REQUIRED",
              message: "Authentication required for this operation",
            })
          );
        }
        ws.close(1008, "Authentication required");
        return;
      }

      switch (parsedMessage.type) {
        case "get-dashboard-summary":
          try {
            // Fetch all resource counts concurrently for dashboard summary
            const [containers, images, networks, volumes] = await Promise.all([
              dockerService.getDockerContainers(),
              dockerService.getDockerImages(),
              dockerService.getDockerNetworks(),
              dockerService.getDockerVolumes(),
            ]);

            const summary = {
              containers: containers.length,
              images: images.length,
              networks: networks.length,
              volumes: volumes.length,
            };

            ws.send(
              JSON.stringify({
                type: "dashboard-summary-result",
                data: summary,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get dashboard summary",
              })
            );
          }
          break;

        case "get-containers":
          try {
            const containers = await dockerService.getDockerContainers();
            ws.send(
              JSON.stringify({
                type: "containers-list",
                data: containers,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get containers",
              })
            );
          }
          break;

        case "start-stats-streaming":
          try {
            // Start stats streaming if not already started
            if (!dockerService.isStatsStreaming()) {
              dockerService.startStatsStreaming();
            }

            ws.send(
              JSON.stringify({
                type: "stats-streaming-started",
                message: "Real-time container stats streaming started",
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to start stats streaming",
              })
            );
          }
          break;

        case "stop-stats-streaming":
          // Only stop if this is the last client requesting stats
          const activeClients = Array.from(clients.values()).filter(
            (c) => c.isActive
          );
          if (activeClients.length <= 1) {
            dockerService.stopStatsStreaming();
          }

          ws.send(
            JSON.stringify({
              type: "stats-streaming-stopped",
              message: "Real-time container stats streaming stopped",
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "ping":
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
              clientId: clientId,
            })
          );
          break;

        case "start-container":
          try {
            const { containerId } = parsedMessage;
            if (!containerId) {
              throw new Error("Container ID is required");
            }

            const result = await dockerService.startContainer(containerId);
            ws.send(
              JSON.stringify({
                type: "container-action-result",
                action: "start",
                containerId,
                success: result.success,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("container_start", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: result.success ? "success" : "failed",
              message: result.message,
            });

            // Refresh container list after action
            if (result.success) {
              setTimeout(async () => {
                try {
                  const containers = await dockerService.getDockerContainers();
                  // Broadcast to all clients
                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing containers after start:",
                    error
                  );
                }
              }, 1000);
            }
          } catch (error) {
            await recordAction("container_start", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to start container",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to start container",
              })
            );
          }
          break;

        case "stop-container":
          try {
            const { containerId } = parsedMessage;
            if (!containerId) {
              throw new Error("Container ID is required");
            }

            const result = await dockerService.stopContainer(containerId);
            ws.send(
              JSON.stringify({
                type: "container-action-result",
                action: "stop",
                containerId,
                success: result.success,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("container_stop", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: result.success ? "success" : "failed",
              message: result.message,
            });

            // Refresh container list after action
            if (result.success) {
              setTimeout(async () => {
                try {
                  const containers = await dockerService.getDockerContainers();
                  // Broadcast to all clients
                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing containers after stop:",
                    error
                  );
                }
              }, 1000);
            }
          } catch (error) {
            await recordAction("container_stop", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to stop container",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to stop container",
              })
            );
          }
          break;

        case "restart-container":
          try {
            const { containerId } = parsedMessage;
            if (!containerId) {
              throw new Error("Container ID is required");
            }

            const result = await dockerService.restartContainer(containerId);
            ws.send(
              JSON.stringify({
                type: "container-action-result",
                action: "restart",
                containerId,
                success: result.success,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("container_restart", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: result.success ? "success" : "failed",
              message: result.message,
            });

            // Refresh container list after action
            if (result.success) {
              setTimeout(async () => {
                try {
                  const containers = await dockerService.getDockerContainers();
                  // Broadcast to all clients
                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing containers after restart:",
                    error
                  );
                }
              }, 1000);
            }
          } catch (error) {
            await recordAction("container_restart", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to restart container",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to restart container",
              })
            );
          }
          break;

        case "remove-container":
          try {
            const { containerId } = parsedMessage;
            if (!containerId) {
              throw new Error("Container ID is required");
            }

            const result = await dockerService.removeContainer(containerId);
            ws.send(
              JSON.stringify({
                type: "container-action-result",
                action: "remove",
                containerId,
                success: result.success,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("container_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: result.success ? "success" : "failed",
              message: result.message,
            });

            if (result.success) {
              setTimeout(async () => {
                try {
                  const containers = await dockerService.getDockerContainers();
                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing containers after remove:",
                    error
                  );
                }
              }, 1000);
            }
          } catch (error) {
            await recordAction("container_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to remove container",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to remove container",
              })
            );
          }
          break;

        case "prune-containers":
          try {
            const result = await dockerService.pruneContainers();
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-containers",
                success: result.success,
                message: result.message,
                data: result.data,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("containers_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              status: result.success ? "success" : "failed",
              message: result.message,
              metadata: result.data ? { summary: result.data } : undefined,
            });

            if (result.success) {
              setTimeout(async () => {
                try {
                  const containers = await dockerService.getDockerContainers();
                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing containers after prune:",
                    error
                  );
                }
              }, 500);
            }
          } catch (error) {
            await recordAction("containers_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to prune containers",
            });
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-containers",
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to prune containers",
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "prune-images":
          try {
            const { all } = parsedMessage;
            const result = await dockerService.pruneImages(!!all);
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-images",
                scope: result.data?.scope || (all ? "all" : "dangling"),
                success: result.success,
                message: result.message,
                data: result.data,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("images_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "image",
              status: result.success ? "success" : "failed",
              message: result.message,
              metadata: {
                scope: result.data?.scope || (all ? "all" : "dangling"),
                reclaimed: result.data?.SpaceReclaimed,
              },
            });

            if (result.success) {
              setTimeout(async () => {
                try {
                  const images = await dockerService.getDockerImages();
                  broadcastToAllClients({
                    type: "images-list",
                    data: images,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error("Error refreshing images after prune:", error);
                }
              }, 500);
            }
          } catch (error) {
            await recordAction("images_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "image",
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to prune images",
            });
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-images",
                success: false,
                scope: parsedMessage?.all ? "all" : "dangling",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to prune images",
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "prune-networks":
          try {
            const result = await dockerService.pruneDockerNetworks();
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-networks",
                success: result.success,
                message: result.message,
                data: result.data,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("networks_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "network",
              status: result.success ? "success" : "failed",
              message: result.message,
              metadata: result.data ? { summary: result.data } : undefined,
            });

            if (result.success) {
              setTimeout(async () => {
                try {
                  const networks = await dockerService.getDockerNetworks();
                  broadcastToAllClients({
                    type: "networks-result",
                    data: networks,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing networks after prune:",
                    error
                  );
                }
              }, 500);
            }
          } catch (error) {
            await recordAction("networks_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "network",
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to prune networks",
            });
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-networks",
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to prune networks",
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "prune-volumes":
          try {
            const result = await dockerService.pruneDockerVolumes();
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-volumes",
                success: true,
                data: result,
                message: `Pruned ${result.deletedVolumes.length} volumes, reclaimed ${result.reclaimedSpace}`,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("volumes_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "volume",
              status: "success",
              message: `Pruned ${result.deletedVolumes.length} volumes, reclaimed ${result.reclaimedSpace}`,
              metadata: {
                deletedVolumes: result.deletedVolumes,
                reclaimedSpace: result.reclaimedSpace,
              },
            });

            setTimeout(async () => {
              try {
                const volumes = await dockerService.getDockerVolumes();
                broadcastToAllClients({
                  type: "volumes-result",
                  data: volumes,
                  timestamp: new Date().toISOString(),
                });
              } catch (error) {
                console.error("Error refreshing volumes after prune:", error);
              }
            }, 500);
          } catch (error) {
            await recordAction("volumes_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "volume",
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to prune volumes",
            });
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "prune-volumes",
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to prune volumes",
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "system-prune":
          try {
            const { includeVolumes } = parsedMessage;
            const result = await dockerService.systemPrune(!!includeVolumes);
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "system-prune",
                includeVolumes: !!includeVolumes,
                success: result.success,
                message: result.message,
                data: result.data,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("system_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "docker",
              status: result.success ? "success" : "failed",
              message: result.message,
              metadata: {
                includeVolumes: !!includeVolumes,
                summary: result.data,
              },
            });

            if (result.success) {
              setTimeout(async () => {
                try {
                  const [containers, images, networks, volumes] =
                    await Promise.all([
                      dockerService.getDockerContainers(),
                      dockerService.getDockerImages(),
                      dockerService.getDockerNetworks(),
                      dockerService.getDockerVolumes(),
                    ]);

                  broadcastToAllClients({
                    type: "containers-list",
                    data: containers,
                    timestamp: new Date().toISOString(),
                  });
                  broadcastToAllClients({
                    type: "images-list",
                    data: images,
                    timestamp: new Date().toISOString(),
                  });
                  broadcastToAllClients({
                    type: "networks-result",
                    data: networks,
                    timestamp: new Date().toISOString(),
                  });
                  broadcastToAllClients({
                    type: "volumes-result",
                    data: volumes,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error(
                    "Error refreshing resources after system prune:",
                    error
                  );
                }
              }, 500);
            }
          } catch (error) {
            await recordAction("system_prune", {
              session,
              ipAddress: clientIP,
              resourceType: "docker",
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to run system prune",
            });
            ws.send(
              JSON.stringify({
                type: "cleanup-result",
                action: "system-prune",
                includeVolumes: !!parsedMessage?.includeVolumes,
                success: false,
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to run system prune",
                timestamp: new Date().toISOString(),
              })
            );
          }
          break;

        case "get-container-details":
          try {
            const { containerId } = parsedMessage;
            if (!containerId) {
              throw new Error("Container ID is required");
            }

            console.log(`Requesting container details for: ${containerId}`);
            const containerDetails =
              await dockerService.getDockerContainerDetails(containerId);
            console.log(
              `Container details retrieved successfully for: ${containerId}`
            );
            ws.send(
              JSON.stringify({
                type: "container-details-result",
                data: containerDetails,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.error(`Error getting container details:`, error);
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get Docker container details",
              })
            );
          }
          break;

        case "terminal-connect":
          try {
            const { terminalId, containerId } = parsedMessage;
            if (!terminalId || !containerId) {
              throw new Error("Terminal ID and Container ID are required");
            }

            // Check if terminal session already exists for this terminalId
            if (client.terminals?.has(terminalId)) {
              console.log(
                `Terminal session already exists for terminal ${terminalId}, ignoring duplicate request`
              );
              return; // Ignore duplicate connection request
            }

            // Create terminal session (now async)
            const terminal = await dockerService.createTerminalSession(
              containerId
            );
            client.terminals?.set(terminalId, terminal);

            // Handle terminal output (node-pty uses 'data' event directly)
            terminal.on("data", (data: string) => {
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "terminal-data",
                    terminalId,
                    containerId,
                    data: data,
                  })
                );
              }
            });

            terminal.on("exit", (code: number, signal: number) => {
              console.log(
                `Terminal ${terminalId} for container ${containerId} exited with code ${code}, signal ${signal}`
              );
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "terminal-disconnected",
                    terminalId,
                    containerId,
                    code,
                    signal,
                  })
                );
              }
              client.terminals?.delete(terminalId);
            });

            terminal.on("error", (error: Error) => {
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "terminal-error",
                    terminalId,
                    containerId,
                    error: error.message,
                  })
                );
              }
              client.terminals?.delete(terminalId);
            });

            // Don't send connection confirmation message
            // Just set the connected state on the client side

            await recordAction("terminal_connect", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: "success",
              message: `Terminal ${terminalId} connected`,
            });
          } catch (error) {
            await recordAction("terminal_connect", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to connect terminal",
            });
            ws.send(
              JSON.stringify({
                type: "terminal-error",
                terminalId: parsedMessage.terminalId,
                containerId: parsedMessage.containerId,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to connect terminal",
              })
            );
          }
          break;

        case "terminal-input":
          try {
            const { terminalId, data } = parsedMessage;
            const terminal = client.terminals?.get(terminalId);
            if (terminal && terminal.write) {
              terminal.write(data);
            }
          } catch (error) {
            console.error("Error handling terminal input:", error);
          }
          break;

        case "terminal-resize":
          try {
            const { terminalId, cols, rows } = parsedMessage;
            const terminal = client.terminals?.get(terminalId);
            if (terminal && terminal.resize) {
              terminal.resize(cols, rows);
            }
          } catch (error) {
            console.error("Error resizing terminal:", error);
          }
          break;

        case "terminal-disconnect":
          try {
            const { terminalId } = parsedMessage;
            const terminal = client.terminals?.get(terminalId);
            if (terminal) {
              terminal.kill();
              client.terminals?.delete(terminalId);
              console.log(`Disconnected terminal ${terminalId}`);
            }
            await recordAction("terminal_disconnect", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "success",
              message: `Terminal ${terminalId} disconnected`,
            });
          } catch (error) {
            await recordAction("terminal_disconnect", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Error disconnecting terminal",
            });
            console.error("Error disconnecting terminal:", error);
          }
          break;

        case "logs-connect":
          try {
            const { terminalId, containerId } = parsedMessage;
            if (!terminalId || !containerId) {
              throw new Error("Terminal ID and Container ID are required");
            }

            // Check if logs session already exists for this terminalId
            if (client.terminals?.has(terminalId)) {
              console.log(
                `Logs session already exists for terminal ${terminalId}, ignoring duplicate request`
              );
              return; // Ignore duplicate connection request
            }

            // Create logs session
            const logsSession = await dockerService.createLogsSession(
              containerId
            );
            client.terminals?.set(terminalId, logsSession);

            console.log(
              `Created logs session ${terminalId} for container ${containerId}`
            );

            // Handle logs output
            logsSession.on("data", (data: string) => {
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "logs-data",
                    terminalId,
                    containerId,
                    data: data,
                  })
                );
              }
            });

            logsSession.on("exit", (code: number, signal: number) => {
              console.log(
                `Logs session ${terminalId} for container ${containerId} exited with code ${code}, signal ${signal}`
              );
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "logs-disconnected",
                    terminalId,
                    containerId,
                    code,
                    signal,
                  })
                );
              }
              client.terminals?.delete(terminalId);
            });

            logsSession.on("error", (error: Error) => {
              if (client.isActive && ws.readyState === 1) {
                ws.send(
                  JSON.stringify({
                    type: "logs-error",
                    terminalId,
                    containerId,
                    error: error.message,
                  })
                );
              }
              client.terminals?.delete(terminalId);
            });

            await recordAction("logs_stream_start", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: containerId,
              status: "success",
              message: `Logs streaming started for container ${containerId}`,
            });
          } catch (error) {
            await recordAction("logs_stream_start", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to connect to logs",
            });
            ws.send(
              JSON.stringify({
                type: "logs-error",
                terminalId: parsedMessage.terminalId,
                containerId: parsedMessage.containerId,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to connect to logs",
              })
            );
          }
          break;

        case "logs-disconnect":
          try {
            const { terminalId } = parsedMessage;
            const logsSession = client.terminals?.get(terminalId);
            if (logsSession) {
              logsSession.kill();
              client.terminals?.delete(terminalId);
              console.log(`Disconnected logs session ${terminalId}`);
            }
            await recordAction("logs_stream_stop", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "success",
              message: `Logs stream disconnected (${terminalId})`,
            });
          } catch (error) {
            await recordAction("logs_stream_stop", {
              session,
              ipAddress: clientIP,
              resourceType: "container",
              resourceId: parsedMessage?.containerId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Error disconnecting logs session",
            });
            console.error("Error disconnecting logs session:", error);
          }
          break;

        case "get-images":
          try {
            const images = await dockerService.getDockerImages();
            ws.send(
              JSON.stringify({
                type: "images-list",
                data: images,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get images",
              })
            );
          }
          break;

        case "get-image-details":
          try {
            const { imageId } = parsedMessage;
            if (!imageId) {
              throw new Error("Image ID is required");
            }

            console.log(`Requesting image details for: ${imageId}`);
            const imageDetails = await dockerService.getDockerImageDetails(
              imageId
            );
            console.log(`Image details retrieved successfully for: ${imageId}`);
            console.log("Sending image details response:", {
              type: "image-details-result",
              imageId: imageDetails.imageId,
              id: imageDetails.id,
            });

            ws.send(
              JSON.stringify({
                type: "image-details-result",
                data: imageDetails,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.error(`Error getting image details:`, error);
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get Docker image details",
              })
            );
          }
          break;

        case "remove-image":
          try {
            const { imageId, force } = parsedMessage;
            if (!imageId) {
              throw new Error("Image ID is required");
            }

            const result = await dockerService.removeImage(imageId, force);
            ws.send(
              JSON.stringify({
                type: "image-action-result",
                action: "remove",
                imageId,
                success: result.success,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );

            await recordAction("image_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "image",
              resourceId: imageId,
              status: result.success ? "success" : "failed",
              message: result.message,
              metadata: { force: !!force },
            });

            // Refresh images list after action
            if (result.success) {
              setTimeout(async () => {
                try {
                  const images = await dockerService.getDockerImages();
                  broadcastToAllClients({
                    type: "images-list",
                    data: images,
                    timestamp: new Date().toISOString(),
                  });
                } catch (error) {
                  console.error("Error refreshing images after remove:", error);
                }
              }, 1000);
            }
          } catch (error) {
            await recordAction("image_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "image",
              resourceId: parsedMessage?.imageId,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to remove image",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to remove image",
              })
            );
          }
          break;

        case "get-image-history":
          try {
            const { imageId } = parsedMessage;
            if (!imageId) {
              throw new Error("Image ID is required");
            }

            const result = await dockerService.getImageHistory(imageId);
            ws.send(
              JSON.stringify({
                type: "image-history-result",
                imageId,
                success: result.success,
                data: result.data,
                message: result.message,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get image history",
              })
            );
          }
          break;

        case "get-networks":
          try {
            const networks = await dockerService.getDockerNetworks();
            ws.send(
              JSON.stringify({
                type: "networks-result",
                data: networks,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get Docker networks",
              })
            );
          }
          break;

        case "get-volumes":
          try {
            const volumes = await dockerService.getDockerVolumes();
            ws.send(
              JSON.stringify({
                type: "volumes-result",
                data: volumes,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get Docker volumes",
              })
            );
          }
          break;

        case "get-volume-details":
          try {
            const { volumeName } = parsedMessage;
            if (!volumeName) {
              throw new Error("Volume name is required");
            }

            const volumeDetails = await dockerService.getDockerVolumeDetails(
              volumeName
            );
            ws.send(
              JSON.stringify({
                type: "volume-details-result",
                data: volumeDetails,
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to get Docker volume details",
              })
            );
          }
          break;

        case "remove-volume":
          try {
            const { volumeName } = parsedMessage;
            if (!volumeName) {
              throw new Error("Volume name is required");
            }

            await dockerService.removeDockerVolume(volumeName);

            // Broadcast success to all clients
            broadcastToAllClients({
              type: "volume-removed",
              data: { volumeName },
              timestamp: new Date().toISOString(),
            });

            ws.send(
              JSON.stringify({
                type: "volume-remove-result",
                success: true,
                message: `Volume "${volumeName}" removed successfully`,
                timestamp: new Date().toISOString(),
              })
            );
            await recordAction("volume_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "volume",
              resourceId: volumeName,
              status: "success",
              message: `Volume "${volumeName}" removed successfully`,
            });
          } catch (error) {
            await recordAction("volume_remove", {
              session,
              ipAddress: clientIP,
              resourceType: "volume",
              resourceId: parsedMessage?.volumeName,
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to remove volume",
            });
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to remove volume",
              })
            );
          }
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "echo",
              data: parsedMessage,
              clientId: clientId,
            })
          );
      }
    } catch (error) {
      // Handle non-JSON messages
      console.log(`received raw message from ${clientId}: %s`, data);
      ws.send(
        JSON.stringify({
          type: "echo",
          data: data.toString(),
          clientId: clientId,
        })
      );
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    console.log(`Client disconnected: ${clientId}`);
    client.isActive = false;

    // Clean up terminals for this client
    if (client.terminals) {
      for (const [terminalId, terminal] of client.terminals.entries()) {
        try {
          terminal.kill();
          console.log(`Cleaned up terminal ${terminalId}`);
        } catch (error) {
          console.error(`Error cleaning up terminal ${terminalId}:`, error);
        }
      }
      client.terminals.clear();
    }

    clients.delete(clientId);

    // Stop stats streaming if no active clients
    if (clients.size === 0 && dockerService.isStatsStreaming()) {
      console.log("No active clients, stopping stats streaming");
      dockerService.stopStatsStreaming();
    }
  });

  // Handle WebSocket errors
  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    client.isActive = false;

    // Clean up terminals for this client
    if (client.terminals) {
      for (const [containerId, terminal] of client.terminals.entries()) {
        try {
          terminal.kill();
          console.log(`Cleaned up terminal for container ${containerId}`);
        } catch (cleanupError) {
          console.error(
            `Error cleaning up terminal for container ${containerId}:`,
            cleanupError
          );
        }
      }
      client.terminals.clear();
    }

    clients.delete(clientId);
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Connected to Docker Web GUI server",
      timestamp: new Date().toISOString(),
      clientId: clientId,
    })
  );
});
