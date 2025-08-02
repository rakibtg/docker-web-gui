import { parse } from "url";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { join, extname } from "path";
import { readFileSync, existsSync } from "fs";
import { DockerService, ContainerWithStats } from "./dockerService";

import { 
  AuthSession,
  createSession, 
  destroySession, 
  isAuthRequired,
  validateSession, 
  authenticateUser, 
} from "./auth";

import { isIPAllowed, extractClientIP } from "./settings";

// Client management for WebSocket connections
interface ClientConnection {
  ws: any;
  id: string;
  lastPing: number;
  isActive: boolean;
  session?: AuthSession;
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
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}

// Helper function to read request body
function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
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
      res.end(JSON.stringify({
        error: "IP_NOT_ALLOWED",
        message: "Access denied from your IP address"
      }));
      return;
    }
  }

  // Handle IP access check endpoint
  if (pathname === "/api/ip-access" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    const allowed = isIPAllowed(clientIP);
    res.writeHead(200);
    res.end(JSON.stringify({
      allowed,
      ip: clientIP
    }));
    return;
  }

  // Handle authentication API routes
  if (pathname.startsWith("/api/auth/")) {
    res.setHeader("Content-Type", "application/json");
    
    if (pathname === "/api/auth/status" && req.method === "GET") {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = cookies.session_token;
      
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
      res.end(JSON.stringify({
        isAuthRequired: authRequired,
        isAuthenticated,
        user
      }));
      return;
    }
    
    if (pathname === "/api/auth/login" && req.method === "POST") {
      try {
        const body = await readRequestBody(req);
        const { username, password } = JSON.parse(body);
        
        if (!isAuthRequired()) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: "Authentication not required" }));
          return;
        }
        
        if (authenticateUser(username, password)) {
          const session = createSession(username);
          
          // Set secure HTTP-only cookie
          res.setHeader("Set-Cookie", [
            `session_token=${session.token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`
          ]);
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            user: { username: session.username }
          }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, message: "Invalid credentials" }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "Invalid request" }));
      }
      return;
    }
    
    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const cookies = parseCookies(req.headers.cookie || "");
      const sessionToken = cookies.session_token;
      
      if (sessionToken) {
        destroySession(sessionToken);
      }
      
      res.setHeader("Set-Cookie", [
        "session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
      ]);
      
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Default to index.html for root path
  if (pathname === "/") {
    pathname = "/index.html";
  }

  // Construct file path
  const filePath = join(__dirname, "../public", pathname);

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
      const indexPath = join(__dirname, "../public/index.html");
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

// Start HTTP server on port 8080
server.listen(8080, () => {
  console.log("HTTP server running on port 8080");
});

// Create WebSocket server using the HTTP server
const wss = new WebSocketServer({ server });

console.log("WebSocket server running on port 8080");

wss.on("connection", function connection(ws, req) {
  const clientId = generateClientId();
  const clientIP = extractClientIP(req);
  
  console.log(`New client connected: ${clientId} from IP: ${clientIP}`);

  // Check IP access first
  if (!isIPAllowed(clientIP)) {
    console.log(`IP access denied for client: ${clientId} (IP: ${clientIP})`);
    ws.close(1008, "IP_NOT_ALLOWED");
    return;
  }

  // Check authentication if required
  let session: AuthSession | undefined = undefined;
  if (isAuthRequired()) {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = cookies.session_token;
    
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
    
    console.log(`Authenticated client connected: ${clientId} (user: ${session.username})`);
  }

  // Register client
  const client: ClientConnection = {
    ws,
    session,
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

  // Helper function to check if client is authenticated for Docker operations
  function isClientAuthenticated(): boolean {
    if (!isAuthRequired()) {
      return true; // No auth required
    }
    return client.session !== undefined;
  }

  ws.on("message", async function message(data) {
    if (!client.isActive) return;

    client.lastPing = Date.now();

    try {
      const parsedMessage = JSON.parse(data.toString());

      // Check authentication for Docker-related operations
      const dockerOperations = [
        "get-images",
        "get-volumes",
        "remove-image",
        "get-networks",
        "stop-container",
        "terminal-input",
        "get-containers", 
        "terminal-resize",
        "start-container",
        "terminal-create",
        "remove-container",
        "restart-container",
        "stop-stats-streaming",
        "get-dashboard-summary",
        "start-stats-streaming",
      ];

      if (dockerOperations.includes(parsedMessage.type) && !isClientAuthenticated()) {
        ws.send(JSON.stringify({
          type: "error",
          code: "AUTH_REQUIRED",
          message: "Authentication required for this operation",
        }));
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
          } catch (error) {
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
          } catch (error) {
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
          } catch (error) {
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
          } catch (error) {
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
          } catch (error) {
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
