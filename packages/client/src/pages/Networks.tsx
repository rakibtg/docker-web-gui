import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { MdRefresh } from "react-icons/md";
import { useNetworks } from "../hooks/useNetworks";
import { PageWrapper } from "../components/PageWrapper";
import { NetworkGrid, NetworkFilters, EntityEmptyState } from "../components";

const Networks = memo(function Networks() {
  const { dockerAvailable, isConnected } = useApp();

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

  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestNetworks();
    }
  }, [isConnected, dockerAvailable, requestNetworks]);

  return (
    <PageWrapper>
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
            Networks
          </h2>
          <button
            title="Refresh Networks"
            onClick={requestNetworks}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
          >
            <MdRefresh className="h-4 w-4" />
          </button>
        </div>

        <NetworkFilters
          onSearch={handleSearch}
          onDriverFilter={handleDriverFilter}
          selectedDriver={selectedDriver}
          searchTerm={searchTerm}
        />
      </div>

      {allNetworks.length > 0 ? (
        <div className="space-y-6">
          <NetworkGrid networks={networks} />
        </div>
      ) : (
        <EntityEmptyState
          entityName="Networks"
          loading={networksLoading}
          isConnected={isConnected}
          entityReload={requestNetworks}
          dockerAvailable={dockerAvailable}
        />
      )}
    </PageWrapper>
  );
});

export { Networks };
