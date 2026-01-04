import type {
  WebSocketContext,
  ClientConnection,
  MessageHandlerMap,
} from "./types";

import {
  parseCookies,
  isWebSocketOriginAllowed,
  getSessionTokenFromCookies,
} from "../utils/requestUtils";

import { Server } from "http";
import { WebSocketServer } from "ws";
import type { AuthSession } from "../auth";
import { createPingHandlers } from "./handlers/ping";
import { createLogsHandlers } from "./handlers/logs";
import { createStatsHandlers } from "./handlers/stats";
import { validateContainerIdInput } from "./validation";
import { createImageHandlers } from "./handlers/images";
import { createSystemHandlers } from "./handlers/system";
import { isAuthRequired, validateSession } from "../auth";
import { createVolumeHandlers } from "./handlers/volumes";
import { extractClientIP, isIPAllowed } from "../settings";
import { createNetworkHandlers } from "./handlers/networks";
import { createTerminalHandlers } from "./handlers/terminals";
import { createDashboardHandlers } from "./handlers/dashboard";
import { createContainerHandlers } from "./handlers/containers";
import { DockerService, ContainerWithStats } from "../dockerService";

const dockerService = new DockerService();
const clients = new Map<string, ClientConnection>();

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

function buildHandlers(context: WebSocketContext): MessageHandlerMap {
  return {
    ...createDashboardHandlers(context),
    ...createContainerHandlers(context),
    ...createStatsHandlers(context),
    ...createPingHandlers(),
    ...createTerminalHandlers(context),
    ...createLogsHandlers(context),
    ...createImageHandlers(context),
    ...createNetworkHandlers(context),
    ...createVolumeHandlers(context),
    ...createSystemHandlers(context),
  };
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

export function initializeWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server });
  const context: WebSocketContext = {
    clients,
    dockerService,
    broadcastToAllClients,
    validateContainerIdInput,
  };
  const handlers = buildHandlers(context);

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

        const handler = handlers[parsedMessage.type];
        if (handler) {
          await handler({
            ws,
            client,
            clientId,
            clientIP,
            session,
            parsedMessage,
          });
          return;
        }

        ws.send(
          JSON.stringify({
            type: "echo",
            data: parsedMessage,
            clientId: clientId,
          })
        );
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
}
