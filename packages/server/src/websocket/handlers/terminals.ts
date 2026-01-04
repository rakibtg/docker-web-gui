import { recordAction } from "../../audit";
import { MessageHandlerMap, WebSocketContext } from "../types";

export function createTerminalHandlers(
  context: WebSocketContext
): MessageHandlerMap {
  const { dockerService, validateContainerIdInput } = context;

  return {
    "terminal-connect": async ({
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
    },
    "terminal-input": ({ client, parsedMessage }) => {
      try {
        const { terminalId, data } = parsedMessage;
        const terminal = client.terminals?.get(terminalId);
        if (terminal && terminal.write) {
          terminal.write(data);
        }
      } catch (error) {
        console.error("Error handling terminal input:", error);
      }
    },
    "terminal-resize": ({ client, parsedMessage }) => {
      try {
        const { terminalId, cols, rows } = parsedMessage;
        const terminal = client.terminals?.get(terminalId);
        if (terminal && terminal.resize) {
          terminal.resize(cols, rows);
        }
      } catch (error) {
        console.error("Error resizing terminal:", error);
      }
    },
    "terminal-disconnect": async ({
      client,
      parsedMessage,
      clientIP,
      session,
    }) => {
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
    },
  };
}
