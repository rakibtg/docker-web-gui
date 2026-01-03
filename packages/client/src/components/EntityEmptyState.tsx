import { memo } from "react";
import { FaExclamationTriangle, FaNetworkWired, FaPlug } from "react-icons/fa";

interface EntityEmptyStateProps {
  loading: boolean;
  entityName: string;
  isConnected: boolean;
  entityReload: () => void;
  dockerAvailable: boolean | null;
}

const EntityEmptyState = memo(function EntityEmptyState({
  loading,
  entityName,
  isConnected,
  entityReload,
  dockerAvailable,
}: EntityEmptyStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h3 className="text-lg font-medium text-gray-100 mb-2">
          Loading {entityName}...
        </h3>
        <p className="text-gray-400">
          Fetching Docker {entityName.toLowerCase()} from the daemon
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FaPlug className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-100 mb-2">
          Not Connected
        </h3>
        <p className="text-gray-400 mb-4">
          Unable to connect to the Docker Web GUI server
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (dockerAvailable === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
        <FaExclamationTriangle className="h-16 w-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-100 mb-2">
          Docker Not Available
        </h3>
        <p className="text-gray-400 mb-4">
          Docker daemon is not running or not accessible! Make sure Docker is
          installed and running on your system.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FaNetworkWired className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-100 mb-2">
        No {entityName} Found
      </h3>
      <p className="text-gray-400 mb-4">
        No Docker {entityName.toLowerCase()} are available or they haven't been
        loaded yet
      </p>
      <button
        onClick={entityReload}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
      >
        Load {entityName}
      </button>
    </div>
  );
});

export { EntityEmptyState };
