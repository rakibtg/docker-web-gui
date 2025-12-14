import { useApp } from "../hooks/useApp";
import { MdRefresh } from "react-icons/md";
import { useTerminal } from "../hooks/useTerminal";
import { memo, useCallback, useState } from "react";
import SearchInput from "../components/SearchInput";
import { PageWrapper } from "../components/PageWrapper";
import { filterContainers } from "../helpers/filterContainers";
import { useContainerFilterStatus } from "../hooks/useContainerFilters";
import { ContainerFilters, ContainerGrid, EmptyState } from "../components";

const ContainersPage = memo(function ContainersPage() {
  const {
    loading,
    containers,
    isConnected,
    dockerAvailable,
    requestContainers,
    handleContainerToggle,
    handleContainerRestart,
    handleContainerRemove,
  } = useApp();

  const { openTerminal, openLogs } = useTerminal();
  const [containerListStatus, setContainerListStatus] =
    useContainerFilterStatus();
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter containers by status and search term (name or id)
  const filteredByStatus = filterContainers(containers, containerListStatus);
  const visibleContainers = filteredByStatus.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
              Containers
            </h2>
            <button
              title="Refresh Containers"
              onClick={requestContainers}
              className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
            >
              <MdRefresh className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search containers..."
            />

            <ContainerFilters
              activeFilter={containerListStatus}
              onFilterChange={setContainerListStatus}
            />
          </div>
        </div>
        {containers.length > 0 ? (
          <ContainerGrid
            containers={visibleContainers}
            onContainerToggle={handleContainerToggle}
            onContainerRestart={handleContainerRestart}
            onOpenTerminal={handleOpenTerminal}
            onOpenLogs={handleOpenLogs}
            onContainerRemove={handleContainerRemove}
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
    </PageWrapper>
  );
});

export { ContainersPage };
