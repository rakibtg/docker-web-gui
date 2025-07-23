import { memo } from "react";

interface VolumeEmptyStateProps {
  dockerAvailable: boolean | null;
  isConnected: boolean;
  loading: boolean;
  onLoadVolumes: () => void;
}

const VolumeEmptyState = memo(function VolumeEmptyState({
  dockerAvailable,
  isConnected,
  loading,
  onLoadVolumes,
}: VolumeEmptyStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-400">Loading volumes...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-100 mb-2">
          Not Connected
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Unable to connect to the Docker server.
        </p>
        <button
          onClick={onLoadVolumes}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (dockerAvailable === false) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-100 mb-2">
          Docker Not Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Docker is not running or not available on this system.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Make sure Docker is installed and running on your system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-100 mb-2">
        No Volumes Found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        There are no Docker volumes on this system.
      </p>
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 max-w-lg mx-auto">
        <h4 className="font-medium text-blue-200 mb-2">
          About Docker Volumes
        </h4>
        <div className="text-blue-800 dark:text-blue-300 text-sm space-y-2 text-left">
          <p>
            Docker volumes are used to persist data generated and used by Docker
            containers. They are stored outside the container's filesystem and
            can be shared between containers.
          </p>
          <p>
            Volumes are created automatically when containers are started with
            volume mounts, or can be created manually using{" "}
            <code className="bg-blue-800 px-1 rounded">
              docker volume create
            </code>
            .
          </p>
        </div>
      </div>
      <button
        onClick={onLoadVolumes}
        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Refresh Volumes
      </button>
    </div>
  );
});

export { VolumeEmptyState };
