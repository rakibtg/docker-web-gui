import { MdError, MdSignalWifiOff, MdStorage, MdRefresh } from "react-icons/md";

interface EmptyStateProps {
  dockerAvailable: boolean | null;
  isConnected: boolean;
  loading: boolean;
  onLoadContainers: () => void;
}

export function EmptyState({
  dockerAvailable,
  isConnected,
  loading,
  onLoadContainers,
}: EmptyStateProps) {
  const getEmptyStateContent = () => {
    if (dockerAvailable === false) {
      return {
        icon: <MdError className="mx-auto h-16 w-16 text-red-400" />,
        title: "Docker Not Available",
        description:
          "Docker is not installed or not running on this system. Please install Docker and make sure it's running.",
        showButton: true,
      };
    }

    if (!isConnected) {
      return {
        icon: <MdSignalWifiOff className="mx-auto h-16 w-16 text-orange-400" />,
        title: "Not Connected",
        description: "Connecting to server...",
        showButton: false,
      };
    }

    return {
      icon: <MdStorage className="mx-auto h-16 w-16 text-blue-400" />,
      title: "No Containers Found",
      description:
        'Click "Load Containers" to fetch container information from Docker.',
      showButton: true,
    };
  };

  const content = getEmptyStateContent();

  return (
    <div className="bg-theme-card rounded-lg shadow-lg p-12 text-center transition-colors">
      <div className="mb-6">{content.icon}</div>
      <h3 className="text-xl font-medium text-theme-primary mb-3 transition-colors">
        {content.title}
      </h3>
      <p className="text-theme-secondary mb-6 max-w-md mx-auto leading-relaxed transition-colors">
        {content.description}
      </p>
      {content.showButton && (
        <button
          onClick={onLoadContainers}
          disabled={!isConnected || loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <MdRefresh className="animate-spin h-4 w-4" />
              Loading...
            </span>
          ) : (
            "Refresh"
          )}
        </button>
      )}
    </div>
  );
}
