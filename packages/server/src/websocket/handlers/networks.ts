import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createNetworkHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, broadcastToAllClients } = context;

  return {
    "get-networks": async ({ ws }) => {
      try {
        const networks = await dockerService.getDockerNetworks();
        ws.send(
          JSON.stringify({
            data: networks,
            type: "networks-result",
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
    },
    "prune-networks": async ({ ws, clientIP, session }) => {
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
              console.error("Error refreshing networks after prune:", error);
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
            error instanceof Error ? error.message : "Failed to prune networks",
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
    },
  };
}
