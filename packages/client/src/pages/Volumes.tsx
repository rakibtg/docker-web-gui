import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { useVolumes } from "../hooks/useVolumes";
import { PageWrapper } from "../components/PageWrapper";
import { VolumeGrid, VolumeFilters, VolumeEmptyState } from "../components";

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
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">Volumes</h1>
        <p className="mt-2 text-gray-400">
          Manage Docker volumes, view usage, and maintain storage
        </p>
      </div>

      {allVolumes.length > 0 ? (
        <div className="space-y-6">
          <VolumeFilters
            volumes={allVolumes}
            onSearch={handleSearch}
            searchTerm={searchTerm}
            selectedDriver={selectedDriver}
            totalVolumes={allVolumes.length}
            filteredVolumes={volumes.length}
            onDriverFilter={handleDriverFilter}
          />

          <VolumeGrid volumes={volumes} />
        </div>
      ) : (
        <VolumeEmptyState
          loading={volumesLoading}
          isConnected={isConnected}
          onLoadVolumes={requestVolumes}
          dockerAvailable={dockerAvailable}
        />
      )}
    </PageWrapper>
  );
});

export { Volumes };
