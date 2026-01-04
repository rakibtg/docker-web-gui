import { Server } from "http";
import { WebSocketServer } from "ws";
import { DockerService, ContainerWithStats } from "../dockerService";
import { AuthSession, isAuthRequired, validateSession } from "../auth";
import { recordAction } from "../audit";
import { extractClientIP, isIPAllowed } from "../settings";
import {
  parseCookies,
  getSessionTokenFromCookies,
  isWebSocketOriginAllowed,
} from "../utils/requestUtils";

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

// Helper function to validate container ID before passing to Docker operations
// This provides defense in depth against command injection
function validateContainerIdInput(containerId: unknown): string {
  if (!containerId || typeof containerId !== "string") {
    throw new Error("Container ID must be a non-empty string");
  }

  const normalized = containerId.trim();

  // Check for reasonable length
  if (normalized.length < 1 || normalized.length > 64) {
    throw new Error("Invalid container ID length");
  }

  // Check for control characters or null bytes (prevents injection)
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    throw new Error("Container ID contains invalid control characters");
  }

  // Check for shell metacharacters (prevents command injection)
  // Allow: letters, numbers, underscores, hyphens, dots
  // Block: semicolons, pipes, ampersands, dollar signs, backticks, spaces, quotes
  if (/[;&|$`\\(){}<>\s"']/.test(normalized)) {
    throw new Error("Container ID contains dangerous characters");
  }

  // Must be either a valid hex ID or a valid container name
  const isValidHexId = /^[a-f0-9]{12,64}$/i.test(normalized);
  const isValidName = /^[A-Za-z0-9_.-]+$/.test(normalized);

  if (!isValidHexId && !isValidName) {
    throw new Error("Invalid container ID or name format");
  }

  return normalized;
}

export function initializeWebSocketServer(server: Server): void {
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
              const [containers, images, networks, volumes] = await Promise.all(
                [
                  dockerService.getDockerContainers(),
                  dockerService.getDockerImages(),
                  dockerService.getDockerNetworks(),
                  dockerService.getDockerVolumes(),
                ]
              );

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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              const result = await dockerService.startContainer(
                validatedContainerId
              );
              ws.send(
                JSON.stringify({
                  type: "container-action-result",
                  action: "start",
                  containerId: validatedContainerId,
                  success: result.success,
                  message: result.message,
                  timestamp: new Date().toISOString(),
                })
              );

              await recordAction("container_start", {
                session,
                ipAddress: clientIP,
                resourceType: "container",
                resourceId: validatedContainerId,
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              const result = await dockerService.stopContainer(
                validatedContainerId
              );
              ws.send(
                JSON.stringify({
                  type: "container-action-result",
                  action: "stop",
                  containerId: validatedContainerId,
                  success: result.success,
                  message: result.message,
                  timestamp: new Date().toISOString(),
                })
              );

              await recordAction("container_stop", {
                session,
                ipAddress: clientIP,
                resourceType: "container",
                resourceId: validatedContainerId,
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              const result = await dockerService.restartContainer(
                validatedContainerId
              );
              ws.send(
                JSON.stringify({
                  type: "container-action-result",
                  action: "restart",
                  containerId: validatedContainerId,
                  success: result.success,
                  message: result.message,
                  timestamp: new Date().toISOString(),
                })
              );

              await recordAction("container_restart", {
                session,
                ipAddress: clientIP,
                resourceType: "container",
                resourceId: validatedContainerId,
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              const result = await dockerService.removeContainer(
                validatedContainerId
              );
              ws.send(
                JSON.stringify({
                  type: "container-action-result",
                  action: "remove",
                  containerId: validatedContainerId,
                  success: result.success,
                  message: result.message,
                  timestamp: new Date().toISOString(),
                })
              );

              await recordAction("container_remove", {
                session,
                ipAddress: clientIP,
                resourceType: "container",
                resourceId: validatedContainerId,
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              console.log(
                `Requesting container details for: ${validatedContainerId}`
              );
              const containerDetails =
                await dockerService.getDockerContainerDetails(
                  validatedContainerId
                );
              console.log(
                `Container details retrieved successfully for: ${validatedContainerId}`
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              // Check if terminal session already exists for this terminalId
              if (client.terminals?.has(terminalId)) {
                console.log(
                  `Terminal session already exists for terminal ${terminalId}, ignoring duplicate request`
                );
                return; // Ignore duplicate connection request
              }

              // Create terminal session (now async)
              // The dockerService will perform additional validation
              const terminal = await dockerService.createTerminalSession(
                validatedContainerId
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

              // Validate container ID before processing
              const validatedContainerId = validateContainerIdInput(containerId);

              // Check if logs session already exists for this terminalId
              if (client.terminals?.has(terminalId)) {
                console.log(
                  `Logs session already exists for terminal ${terminalId}, ignoring duplicate request`
                );
                return; // Ignore duplicate connection request
              }

              // Create logs session
              const logsSession = await dockerService.createLogsSession(
                validatedContainerId
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
}
