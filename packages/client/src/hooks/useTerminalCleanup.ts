import { useEffect } from "react";
import { useApp } from "./useApp";

/**
 * Hook that manages orphaned terminals cleanup
 * Removes terminals for containers that no longer exist
 */
export function useTerminalCleanup() {
  const { containers, terminals, closeTerminal } = useApp();

  useEffect(() => {
    if (containers.length > 0 && terminals.length > 0) {
      const currentContainerIds = containers.map((container) => container.id);

      const orphanedTerminals = terminals.filter(
        (terminal) => !currentContainerIds.includes(terminal.containerId)
      );

      orphanedTerminals.forEach((terminal) => {
        console.log(
          `Cleaning up orphaned terminal: ${terminal.id} for container: ${terminal.containerId}`
        );
        closeTerminal(terminal.id);
      });
    }
  }, [containers, terminals, closeTerminal]);
}
