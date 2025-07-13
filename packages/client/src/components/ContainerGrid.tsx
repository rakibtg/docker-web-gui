import { useApp } from "../hooks/useApp";
import { ContainerCard } from "./ContainerCard";
import { ContainerFilters } from "./ContainerFilters";
import { useContainerFilterStatus } from "../hooks/useRouter";
import type { ContainerWithStats } from "../types";
import { MdRefresh } from "react-icons/md";
import { filterContainers } from "../helpers/filterContainers";
import { useMemo, useCallback, memo } from "react";

interface ContainerGridProps {
  containers: ContainerWithStats[];
  onContainerToggle: (containerId: string, currentState: string) => void;
  onContainerRestart?: (containerId: string) => void;
  onOpenTerminal?: (containerId: string, containerName: string) => void;
  onOpenLogs?: (containerId: string, containerName: string) => void;
}

const ContainerGrid = memo(function ContainerGrid({
  containers,
  onContainerToggle,
  onContainerRestart,
  onOpenTerminal,
  onOpenLogs,
}: ContainerGridProps) {
  const { requestContainers } = useApp();
  const [containerListStatus, setContainerListStatus] =
    useContainerFilterStatus();

  // Filter containers based on the current filter status
  const filteredContainers = useMemo(() => {
    return filterContainers(containers, containerListStatus);
  }, [containers, containerListStatus]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleContainerToggle = useCallback(
    (containerId: string, currentState: string) => {
      onContainerToggle(containerId, currentState);
    },
    [onContainerToggle]
  );

  const handleContainerRestart = useCallback(
    (containerId: string) => {
      onContainerRestart?.(containerId);
    },
    [onContainerRestart]
  );

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      onOpenTerminal?.(containerId, containerName);
    },
    [onOpenTerminal]
  );

  const handleOpenLogs = useCallback(
    (containerId: string, containerName: string) => {
      onOpenLogs?.(containerId, containerName);
    },
    [onOpenLogs]
  );

  if (containers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
            Containers{" "}
            <span className="text-sm text-gray-500 dark:text-gray-400 px-1">
              ({filteredContainers.length}
              {filteredContainers.length !== containers.length
                ? ` of ${containers.length}`
                : ""}
              )
            </span>
          </h2>
          <button
            title="Refresh Containers"
            onClick={requestContainers}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
          >
            <MdRefresh className="h-4 w-4" />
          </button>
        </div>
        <ContainerFilters
          activeFilter={containerListStatus}
          onFilterChange={setContainerListStatus}
        />
      </div>

      {filteredContainers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No {containerListStatus === "all" ? "" : containerListStatus}{" "}
          containers found.
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              onToggle={handleContainerToggle}
              onRestart={handleContainerRestart}
              onOpenTerminal={handleOpenTerminal}
              onOpenLogs={handleOpenLogs}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export { ContainerGrid };
