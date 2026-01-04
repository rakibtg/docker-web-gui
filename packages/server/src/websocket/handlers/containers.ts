import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createContainerHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, broadcastToAllClients, validateContainerIdInput } =
    context;

  return {
    "get-containers": async ({ ws }) => {
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
    },
    "start-container": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { containerId } = parsedMessage;
        if (!containerId) {
          throw new Error("Container ID is required");
        }

        // Validate container ID before processing
        const validatedContainerId = validateContainerIdInput(containerId);

        const result = await dockerService.startContainer(validatedContainerId);
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
              console.error("Error refreshing containers after start:", error);
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
    },
    "stop-container": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { containerId } = parsedMessage;
        if (!containerId) {
          throw new Error("Container ID is required");
        }

        // Validate container ID before processing
        const validatedContainerId = validateContainerIdInput(containerId);

        const result = await dockerService.stopContainer(validatedContainerId);
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
              console.error("Error refreshing containers after stop:", error);
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
    },
    "restart-container": async ({ ws, parsedMessage, clientIP, session }) => {
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
    },
    "remove-container": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { containerId } = parsedMessage;
        if (!containerId) {
          throw new Error("Container ID is required");
        }

        // Validate container ID before processing
        const validatedContainerId = validateContainerIdInput(containerId);

        const result = await dockerService.removeContainer(validatedContainerId);
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
              console.error("Error refreshing containers after remove:", error);
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
    },
    "prune-containers": async ({ ws, clientIP, session }) => {
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
              console.error("Error refreshing containers after prune:", error);
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
    },
    "get-container-details": async ({ ws, parsedMessage }) => {
      try {
        const { containerId } = parsedMessage;
        if (!containerId) {
          throw new Error("Container ID is required");
        }

        // Validate container ID before processing
        const validatedContainerId = validateContainerIdInput(containerId);

        console.log(`Requesting container details for: ${validatedContainerId}`);
        const containerDetails = await dockerService.getDockerContainerDetails(
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
    },
  };
}
