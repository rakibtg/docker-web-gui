import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { MdRefresh } from "react-icons/md";
import { useVolumes } from "../hooks/useVolumes";
import { PageWrapper } from "../components/PageWrapper";
import { VolumeGrid, VolumeFilters, EntityEmptyState } from "../components";

const Volumes = memo(function Volumes() {
  const {
    volumes,
    allVolumes,
    searchTerm,
    handleSearch,
    requestVolumes,
    selectedDriver,
    volumesLoading,
    handleDriverFilter,
  } = useVolumes();

  const { dockerAvailable, isConnected } = useApp();

  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestVolumes();
    }
  }, [isConnected, dockerAvailable, requestVolumes]);

  return (
    <PageWrapper>
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
            Volumes
          </h2>
          <button
            title="Refresh Volumes"
            onClick={requestVolumes}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
          >
            <MdRefresh className="h-4 w-4" />
          </button>
        </div>

        <VolumeFilters
          volumes={allVolumes}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          selectedDriver={selectedDriver}
          onDriverFilter={handleDriverFilter}
        />
      </div>

      {allVolumes.length > 0 ? (
        <div className="space-y-6">
          <VolumeGrid volumes={volumes} />
        </div>
      ) : (
        <EntityEmptyState
          entityName="Volumes"
          loading={volumesLoading}
          isConnected={isConnected}
          entityReload={requestVolumes}
          dockerAvailable={dockerAvailable}
        />
      )}
    </PageWrapper>
  );
});

export { Volumes };
