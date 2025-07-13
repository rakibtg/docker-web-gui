import { memo, useCallback } from "react";
import { ContainerGrid, EmptyState, TerminalManager } from "../components";
import { useApp } from "../hooks/useApp";

const ContainersPage = memo(function ContainersPage() {
  const {
    containers,
    isConnected,
    dockerAvailable,
    loading,
    showTerminals,
    requestContainers,
    handleContainerToggle,
    handleContainerRestart,
    addTerminal,
    addLogs,
  } = useApp();

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      addTerminal(containerId, containerName);
    },
    [addTerminal]
  );

  const handleOpenLogs = useCallback(
    (containerId: string, containerName: string) => {
      addLogs(containerId, containerName);
    },
    [addLogs]
  );

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex-1 ${showTerminals ? "h-1/2" : ""} overflow-auto p-4`}
      >
        <div className="space-y-6">
          {containers.length > 0 ? (
            <ContainerGrid
              containers={containers}
              onContainerToggle={handleContainerToggle}
              onContainerRestart={handleContainerRestart}
              onOpenTerminal={handleOpenTerminal}
              onOpenLogs={handleOpenLogs}
            />
          ) : (
            <EmptyState
              dockerAvailable={dockerAvailable}
              isConnected={isConnected}
              loading={loading}
              onLoadContainers={requestContainers}
            />
          )}
        </div>
      </div>

      {showTerminals && (
        <div className="h-1/2 pt-3">
          <TerminalManager />
        </div>
      )}
    </div>
  );
});

export { ContainersPage };
