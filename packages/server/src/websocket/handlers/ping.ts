import { MessageHandlerMap } from "../types";

export function createPingHandlers(): MessageHandlerMap {
  return {
    ping: ({ ws, clientId }) => {
      ws.send(
        JSON.stringify({
          type: "pong",
          clientId: clientId,
          timestamp: new Date().toISOString(),
        })
      );
    },
  };
}
