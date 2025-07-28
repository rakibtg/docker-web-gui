import { useApp } from "../hooks/useApp";
import { memo, useCallback } from "react";
import { useTerminal } from "../hooks/useTerminal";
import { ContainerGrid, EmptyState } from "../components";

const ContainersPage = memo(function ContainersPage() {
  const {
    loading,
    containers,
    isConnected,
    dockerAvailable,
    requestContainers,
    handleContainerToggle,
    handleContainerRestart,
  } = useApp();

  const { openTerminal, openLogs } = useTerminal();

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      openTerminal(containerId, containerName);
    },
    [openTerminal]
  );

  const handleOpenLogs = useCallback(
    (containerId: string, containerName: string) => {
      openLogs(containerId, containerName);
    },
    [openLogs]
  );

  return (
    <div className="p-4 h-full">
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
  );
});

export { ContainersPage };
