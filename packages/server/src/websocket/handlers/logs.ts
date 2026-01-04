import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createLogsHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, validateContainerIdInput } = context;

  return {
    "logs-connect": async ({
      ws,
      client,
      session,
      clientIP,
      parsedMessage,
    }) => {
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
                terminalId,
                data: data,
                containerId,
                type: "logs-data",
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
    },
    "logs-disconnect": async ({ client, parsedMessage, clientIP, session }) => {
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
    },
  };
}
