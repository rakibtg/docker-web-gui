import { MessageHandlerMap, WebSocketContext } from "../types";

export function createStatsHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, clients } = context;

  return {
    "start-stats-streaming": async ({ ws }) => {
      try {
        // Start stats streaming if not already started
        if (!dockerService.isStatsStreaming()) {
          dockerService.startStatsStreaming();
        }

        ws.send(
          JSON.stringify({
            type: "stats-streaming-started",
            timestamp: new Date().toISOString(),
            message: "Real-time container stats streaming started",
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
    },
    "stop-stats-streaming": ({ ws }) => {
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
    },
  };
}
