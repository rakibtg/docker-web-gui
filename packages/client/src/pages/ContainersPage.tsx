import { memo, useCallback } from "react";
import { ContainerGrid, EmptyState } from "../components";
import { useApp } from "../hooks/useApp";
import { useTerminal } from "../hooks/useTerminal";

const ContainersPage = memo(function ContainersPage() {
  const {
    containers,
    isConnected,
    dockerAvailable,
    loading,
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
