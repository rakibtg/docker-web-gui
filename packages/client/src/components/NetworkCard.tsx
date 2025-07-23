import { memo, useState, useCallback } from "react";
import type { DockerNetwork, DockerContainer } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import { useApp } from "../hooks/useApp";
import {
  FaNetworkWired,
  FaTrash,
  FaPlug,
  FaUnlink,
  FaGlobe,
  FaShieldAlt,
  FaExchangeAlt,
  FaHdd,
  FaClock,
} from "react-icons/fa";
import { IoReloadCircle } from "react-icons/io5";
import { BsCircleFill } from "react-icons/bs";

function CardActionButton({
  children,
  disabled = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`cursor-pointer px-2 py-1 text-white hover:bg-red-700/40 transition-colors rounded text-xs font-medium flex items-center gap-1 shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

interface NetworkCardProps {
  network: DockerNetwork;
  containers: DockerContainer[];
}

const NetworkCard = memo(function NetworkCard({
  network,
  containers,
}: NetworkCardProps) {
  const {
    handleNetworkRemove,
    handleContainerNetworkConnect,
    handleContainerNetworkDisconnect,
  } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [containerToDisconnect, setContainerToDisconnect] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsRemoving(true);
    setShowDeleteModal(false);
    try {
      await handleNetworkRemove(network.id, network.name);
    } finally {
      setTimeout(() => {
        setIsRemoving(false);
      }, 1000);
    }
  }, [handleNetworkRemove, network.id, network.name]);

  const handleConnect = useCallback(() => {
    if (selectedContainer) {
      const container = containers.find((c) => c.id === selectedContainer);
      handleContainerNetworkConnect(
        network.id,
        selectedContainer,
        network.name,
        container?.name
      );
      setShowConnectModal(false);
      setSelectedContainer("");
    }
  }, [
    handleContainerNetworkConnect,
    network.id,
    network.name,
    selectedContainer,
    containers,
  ]);

  const handleDisconnect = useCallback(
    (containerId: string, containerName: string) => {
      setContainerToDisconnect({ id: containerId, name: containerName });
      setShowDisconnectModal(true);
    },
    []
  );

  const confirmDisconnect = useCallback(() => {
    if (containerToDisconnect) {
      handleContainerNetworkDisconnect(
        network.id,
        containerToDisconnect.id,
        network.name,
        containerToDisconnect.name
      );
      setShowDisconnectModal(false);
      setContainerToDisconnect(null);
    }
  }, [
    handleContainerNetworkDisconnect,
    network.id,
    network.name,
    containerToDisconnect,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };

      return date.toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  const getDriverIcon = (driver: string) => {
    switch (driver) {
      case "bridge":
        return <FaExchangeAlt className="text-blue-400" size={10} />;
      case "host":
        return <FaGlobe className="text-green-400" size={10} />;
      case "overlay":
        return <FaNetworkWired className="text-purple-400" size={10} />;
      default:
        return <FaNetworkWired className="text-gray-400" size={10} />;
    }
  };

  const isBuiltInNetwork = ["bridge", "host", "none"].includes(network.name);
  const availableContainers = containers.filter(
    (container) =>
      !(network.containers || []).some((nc) => nc.id === container.id)
  );

  const connectedCount = network.containers?.length || 0;
  const subnet = network.ipam?.config?.[0]?.subnet;

  return (
    <>
      <div className="bg-gray-800 rounded border border-gray-600 p-3 hover:shadow-md transition-all duration-200">
        {/* Header with network name, driver, and action buttons */}
        <div className="flex items-center justify-between mb-2 relative">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-100 truncate">
              {network.name}
            </h3>
            <span className="inline-flex text-xs px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-100 bg-blue-500/20 shrink-0">
              {network.driver}
            </span>
            {network.internal && (
              <FaShieldAlt
                className="text-orange-400 text-xs shrink-0"
                title="Internal Network"
              />
            )}
          </div>

          <div className="absolute right-0 top-0 flex items-center gap-1">
            {!isBuiltInNetwork && (
              <>
                <CardActionButton
                  onClick={() => setShowConnectModal(true)}
                  title="Connect container"
                  disabled={isRemoving}
                >
                  <div className="flex flex-col items-center gap-1 p-1">
                    <FaPlug size={12} />
                    <span className="text-xs">Connect</span>
                  </div>
                </CardActionButton>
                <CardActionButton
                  onClick={() => setShowDeleteModal(true)}
                  title="Remove network"
                  disabled={isRemoving}
                >
                  <div className="flex flex-col items-center gap-1 p-1">
                    {isRemoving ? (
                      <IoReloadCircle size={12} className="animate-spin" />
                    ) : (
                      <FaTrash size={12} />
                    )}
                    <span className="text-xs">Remove</span>
                  </div>
                </CardActionButton>
              </>
            )}
          </div>
        </div>

        {/* Network details in compact format */}
        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
          <div
            className="flex items-center gap-1"
            title={`Network ID: ${network.id}`}
          >
            {getDriverIcon(network.driver)}
            {network.id?.substring(0, 12) || "N/A"}
          </div>

          <div className="flex items-center gap-1">
            <BsCircleFill className="text-blue-400" size={8} />
            <span>Containers: {connectedCount}</span>
          </div>

          {subnet && (
            <div className="flex items-center gap-1">
              <FaHdd className="text-blue-400" size={10} />
              <span>Subnet: {subnet}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <FaClock className="text-blue-400" size={10} />
            <span title={formatDate(network.created)}>
              Created: {formatDate(network.created)}
            </span>
          </div>
        </div>

        {/* Connected containers - only show if any are connected */}
        {connectedCount > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-400/20">
            <div className="text-xs text-gray-400 mb-1">
              Connected containers:
            </div>
            <div className="flex flex-wrap gap-1">
              {network.containers?.slice(0, 3).map((container) => (
                <div
                  key={container.id}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-400/30 text-green-100 bg-green-500/20"
                >
                  <BsCircleFill className="w-1.5 h-1.5 text-green-400" />
                  <span className="truncate max-w-36">{container.name}</span>
                  {!isBuiltInNetwork && (
                    <button
                      onClick={() =>
                        handleDisconnect(container.id, container.name)
                      }
                      className="ml-1 hover:text-red-300 transition-colors"
                      title="Disconnect container"
                    >
                      <FaUnlink size={8} />
                    </button>
                  )}
                </div>
              ))}
              {connectedCount > 3 && (
                <span className="text-xs text-gray-400">
                  +{connectedCount - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Network"
        message={`Are you sure you want to remove the network "${network.name}"? This action cannot be undone.`}
        confirmText="Remove"
        type="danger"
      />

      {/* Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => {
          setShowDisconnectModal(false);
          setContainerToDisconnect(null);
        }}
        onConfirm={confirmDisconnect}
        title="Disconnect Container"
        message={`Are you sure you want to disconnect "${containerToDisconnect?.name}" from the network "${network.name}"?`}
        confirmText="Disconnect"
        type="warning"
      />

      {/* Connect Container Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Connect Container to {network.name}
            </h3>

            {availableContainers.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Container
                  </label>
                  <select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    title="Select container to connect"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a container...</option>
                    {availableContainers.map((container) => (
                      <option key={container.id} value={container.id}>
                        {container.name} ({container.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleConnect}
                    disabled={!selectedContainer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Connect
                  </button>
                  <button
                    onClick={() => {
                      setShowConnectModal(false);
                      setSelectedContainer("");
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-4">
                  No containers available to connect to this network.
                </p>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export { NetworkCard };
