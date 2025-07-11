import { WebSocketServer } from "ws";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { parse } from "url";
import { DockerService, ContainerWithStats } from "./dockerService";

// Client management for WebSocket connections
interface ClientConnection {
  ws: any;
  id: string;
  isActive: boolean;
  lastPing: number;
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

// Create HTTP server
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url || "/", true);
  let pathname = parsedUrl.pathname || "/";

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
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
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

wss.on("connection", function connection(ws) {
  const clientId = generateClientId();
  console.log(`New client connected: ${clientId}`);

  // Register client
  const client: ClientConnection = {
    ws,
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

  ws.on("message", async function message(data) {
    if (!client.isActive) return;

    client.lastPing = Date.now();

    try {
      const parsedMessage = JSON.parse(data.toString());

      switch (parsedMessage.type) {
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
