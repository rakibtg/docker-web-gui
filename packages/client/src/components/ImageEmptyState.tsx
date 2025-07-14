import { memo } from "react";
import { FaDownload, FaImage, FaExclamationTriangle } from "react-icons/fa";

interface ImageEmptyStateProps {
  dockerAvailable: boolean | null;
  isConnected: boolean;
  loading: boolean;
  onLoadImages: () => void;
}

const ImageEmptyState = memo(function ImageEmptyState({
  dockerAvailable,
  isConnected,
  loading,
  onLoadImages,
}: ImageEmptyStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Loading Images...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Fetching Docker images from the daemon
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FaExclamationTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Not Connected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unable to connect to Docker Web GUI server
        </p>
        <button
          onClick={onLoadImages}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (dockerAvailable === false) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FaExclamationTriangle className="h-16 w-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Docker Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          Docker is not installed, not running, or not accessible. Please ensure
          Docker is installed and running.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FaImage className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Images Found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        You don't have any Docker images yet. Pull an image from Docker Hub or a
        registry to get started.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onLoadImages}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <FaDownload size={14} />
          Refresh Images
        </button>
      </div>
    </div>
  );
});

export { ImageEmptyState };
