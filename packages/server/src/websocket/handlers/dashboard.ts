import { MessageHandlerMap, WebSocketContext } from "../types";

export function createDashboardHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  return {
    "get-dashboard-summary": async ({ ws }) => {
      try {
        // Fetch all resource counts concurrently for dashboard summary
        const [containers, images, networks, volumes] = await Promise.all([
          context.dockerService.getDockerContainers(),
          context.dockerService.getDockerImages(),
          context.dockerService.getDockerNetworks(),
          context.dockerService.getDockerVolumes(),
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
    },
  };
}
