import { useCallback } from "react";
import type { TerminalSession } from "./types";

interface UseTerminalManagementProps {
  terminals: TerminalSession[];
  setTerminals: React.Dispatch<React.SetStateAction<TerminalSession[]>>;
  setActiveTerminalId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowTerminals: React.Dispatch<React.SetStateAction<boolean>>;
  websocket: WebSocket | null;
}

export function useTerminalManagement({
  terminals,
  setTerminals,
  setActiveTerminalId,
  setShowTerminals,
  websocket,
}: UseTerminalManagementProps) {
  // Terminal management functions
  const addTerminal = useCallback(
    (containerId: string, containerName: string) => {
      const id = `terminal-${containerId}-${Date.now()}`;
      const newTerminal: TerminalSession = {
        id,
        containerId,
        containerName,
        isActive: true,
        type: "terminal",
      };

      setTerminals((prev) => [...prev, newTerminal]);
      setActiveTerminalId(id);
      setShowTerminals(true);
    },
    [setTerminals, setActiveTerminalId, setShowTerminals]
  );

  const addLogs = useCallback(
    (containerId: string, containerName: string) => {
      const id = `logs-${containerId}-${Date.now()}`;
      const newLogsSession: TerminalSession = {
        id,
        containerId,
        containerName,
        isActive: true,
        type: "logs",
      };

      setTerminals((prev) => [...prev, newLogsSession]);
      setActiveTerminalId(id);
      setShowTerminals(true);
    },
    [setTerminals, setActiveTerminalId, setShowTerminals]
  );

  const removeTerminal = useCallback(
    (terminalId: string) => {
      setTerminals((prev) => prev.filter((t) => t.id !== terminalId));

      // Update active terminal if needed
      setActiveTerminalId((currentActive) => {
        if (currentActive === terminalId) {
          const filtered = terminals.filter((t) => t.id !== terminalId);
          const lastTerminal = filtered[filtered.length - 1];
          return lastTerminal ? lastTerminal.id : null;
        }
        return currentActive;
      });
    },
    [terminals, setTerminals, setActiveTerminalId]
  );

  const closeTerminal = useCallback(
    (terminalId: string) => {
      const terminal = terminals.find((t) => t.id === terminalId);
      if (terminal && websocket?.readyState === WebSocket.OPEN) {
        const disconnectType =
          terminal.type === "logs" ? "logs-disconnect" : "terminal-disconnect";
        websocket.send(
          JSON.stringify({
            type: disconnectType,
            terminalId: terminal.id, // Use terminalId instead of containerId
            containerId: terminal.containerId,
          })
        );
      }

      removeTerminal(terminalId);

      // Check if this was the last terminal
      const remainingTerminals = terminals.filter((t) => t.id !== terminalId);
      if (remainingTerminals.length === 0) {
        setShowTerminals(false);
        setActiveTerminalId(null);
      }
    },
    [
      terminals,
      websocket,
      removeTerminal,
      setShowTerminals,
      setActiveTerminalId,
    ]
  );

  const closeAllTerminals = useCallback(() => {
    // Close all terminals with proper websocket disconnection
    terminals.forEach((terminal) => {
      if (websocket?.readyState === WebSocket.OPEN) {
        const disconnectType =
          terminal.type === "logs" ? "logs-disconnect" : "terminal-disconnect";
        websocket.send(
          JSON.stringify({
            type: disconnectType,
            terminalId: terminal.id,
            containerId: terminal.containerId,
          })
        );
      }
    });

    // Clear all terminals from state
    setTerminals([]);
    setActiveTerminalId(null);
    setShowTerminals(false);
  }, [
    terminals,
    websocket,
    setTerminals,
    setActiveTerminalId,
    setShowTerminals,
  ]);

  return {
    addTerminal,
    addLogs,
    removeTerminal,
    closeTerminal,
    closeAllTerminals,
  };
}
