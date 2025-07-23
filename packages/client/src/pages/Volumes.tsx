import { memo, useEffect } from "react";
import { VolumeGrid, VolumeFilters, VolumeEmptyState } from "../components";
import { useVolumes } from "../hooks/useVolumes";
import { useApp } from "../hooks/useApp";

const Volumes = memo(function Volumes() {
  const { dockerAvailable, isConnected } = useApp();
  const {
    volumes,
    allVolumes,
    volumesLoading,
    searchTerm,
    selectedDriver,
    handleSearch,
    handleDriverFilter,
    requestVolumes,
  } = useVolumes();

  // Load volumes on component mount
  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestVolumes();
    }
  }, [isConnected, dockerAvailable, requestVolumes]);

  return (
    <div className="space-y-6 p-4">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">
          Volumes
        </h1>
        <p className="mt-2 text-gray-400">
          Manage Docker volumes, view usage, and maintain storage
        </p>
      </div>

      {allVolumes.length > 0 ? (
        <div className="space-y-6">
          <VolumeFilters
            onSearch={handleSearch}
            onDriverFilter={handleDriverFilter}
            totalVolumes={allVolumes.length}
            filteredVolumes={volumes.length}
            selectedDriver={selectedDriver}
            searchTerm={searchTerm}
            volumes={allVolumes}
          />

          <VolumeGrid volumes={volumes} />
        </div>
      ) : (
        <VolumeEmptyState
          dockerAvailable={dockerAvailable}
          isConnected={isConnected}
          loading={volumesLoading}
          onLoadVolumes={requestVolumes}
        />
      )}
    </div>
  );
});

export { Volumes };
