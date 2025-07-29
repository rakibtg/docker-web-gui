import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { useNetworks } from "../hooks/useNetworks";
import { PageWrapper } from "../components/PageWrapper";
import { NetworkGrid, NetworkFilters, NetworkEmptyState } from "../components";

const Networks = memo(function Networks() {
  const { dockerAvailable, isConnected, containers } = useApp();
  const {
    networks,
    searchTerm,
    allNetworks,
    handleSearch,
    selectedDriver,
    networksLoading,
    requestNetworks,
    handleDriverFilter,
  } = useNetworks();

  // Load networks on component mount
  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestNetworks();
    }
  }, [isConnected, dockerAvailable, requestNetworks]);

  return (
    <PageWrapper>
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
    </PageWrapper>
  );
});

export { Networks };
