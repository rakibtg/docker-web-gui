import { useApp } from "./useApp";
import { useCallback } from "react";

/**
 * Hook for terminal operations that can be used anywhere in the app
 * Provides easy access to terminal and logs functionality
 */
export function useTerminal() {
  const {
    addLogs,
    terminals,
    addTerminal,
    showTerminals,
    closeTerminal,
    setShowTerminals,
  } = useApp();

  const openTerminal = useCallback(
    (containerId: string, containerName: string) => {
      addTerminal(containerId, containerName);
    },
    [addTerminal]
  );

  const openLogs = useCallback(
    (containerId: string, containerName: string) => {
      addLogs(containerId, containerName);
    },
    [addLogs]
  );

  const closeTerminalSession = useCallback(
    (terminalId: string) => {
      closeTerminal(terminalId);
    },
    [closeTerminal]
  );

  const toggleTerminals = useCallback(() => {
    setShowTerminals(!showTerminals);
  }, [showTerminals, setShowTerminals]);

  const showTerminalPanel = useCallback(() => {
    setShowTerminals(true);
  }, [setShowTerminals]);

  const hideTerminalPanel = useCallback(() => {
    setShowTerminals(false);
  }, [setShowTerminals]);

  return {
    openLogs,
    terminals,
    openTerminal,
    showTerminals,
    toggleTerminals,
    showTerminalPanel,
    hideTerminalPanel,
    hasTerminals: terminals.length > 0,
    closeTerminal: closeTerminalSession,
  };
}
