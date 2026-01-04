import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createSystemHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, broadcastToAllClients } = context;

  return {
    "system-prune": async ({ ws, parsedMessage, clientIP, session }) => {
      try {
        const { includeVolumes } = parsedMessage;
        const result = await dockerService.systemPrune(!!includeVolumes);
        ws.send(
          JSON.stringify({
            data: result.data,
            type: "cleanup-result",
            action: "system-prune",
            success: result.success,
            message: result.message,
            includeVolumes: !!includeVolumes,
            timestamp: new Date().toISOString(),
          })
        );

        await recordAction("system_prune", {
          session,
          ipAddress: clientIP,
          resourceType: "docker",
          message: result.message,
          status: result.success ? "success" : "failed",
          metadata: {
            includeVolumes: !!includeVolumes,
            summary: result.data,
          },
        });

        if (result.success) {
          setTimeout(async () => {
            try {
              const [containers, images, networks, volumes] = await Promise.all(
                [
                  dockerService.getDockerContainers(),
                  dockerService.getDockerImages(),
                  dockerService.getDockerNetworks(),
                  dockerService.getDockerVolumes(),
                ]
              );

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
    },
  };
}
