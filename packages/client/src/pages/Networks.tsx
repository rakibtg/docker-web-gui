import { memo, useEffect } from "react";
import { NetworkGrid, NetworkFilters, NetworkEmptyState } from "../components";
import { useNetworks } from "../hooks/useNetworks";
import { useApp } from "../hooks/useApp";

const Networks = memo(function Networks() {
  const { dockerAvailable, isConnected, containers } = useApp();
  const {
    networks,
    allNetworks,
    networksLoading,
    searchTerm,
    selectedDriver,
    handleSearch,
    handleDriverFilter,
    requestNetworks,
  } = useNetworks();

  // Load networks on component mount
  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestNetworks();
    }
  }, [isConnected, dockerAvailable, requestNetworks]);

  return (
    <div className="space-y-6 p-4">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">Networks</h1>
        <p className="mt-2 text-gray-400">
          Manage Docker networks and container connectivity
        </p>
      </div>

      {allNetworks.length > 0 ? (
        <div className="space-y-6">
          <NetworkFilters
            onSearch={handleSearch}
            onDriverFilter={handleDriverFilter}
            totalNetworks={allNetworks.length}
            filteredNetworks={networks.length}
            selectedDriver={selectedDriver}
            searchTerm={searchTerm}
          />

          <NetworkGrid networks={networks} containers={containers} />
        </div>
      ) : (
        <NetworkEmptyState
          dockerAvailable={dockerAvailable}
          isConnected={isConnected}
          loading={networksLoading}
          onLoadNetworks={requestNetworks}
        />
      )}
    </div>
  );
});

export { Networks };
