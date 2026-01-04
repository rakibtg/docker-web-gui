import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createVolumeHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, broadcastToAllClients } = context;

  return {
    "get-volumes": async ({ ws }) => {
      try {
        const volumes = await dockerService.getDockerVolumes();
        ws.send(
          JSON.stringify({
            data: volumes,
            type: "volumes-result",
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
    },
    "get-volume-details": async ({ ws, parsedMessage }) => {
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
    },
    "remove-volume": async ({ ws, parsedMessage, clientIP, session }) => {
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
            error instanceof Error ? error.message : "Failed to remove volume",
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
    },
    "prune-volumes": async ({ ws, clientIP, session }) => {
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
            error instanceof Error ? error.message : "Failed to prune volumes",
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
    },
  };
}
