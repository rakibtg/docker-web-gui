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
} from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";

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
  const [selectedContainer, setSelectedContainer] = useState<string>("");

  const handleDelete = useCallback(() => {
    handleNetworkRemove(network.id, network.name);
    setShowDeleteModal(false);
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
      handleContainerNetworkDisconnect(
        network.id,
        containerId,
        network.name,
        containerName
      );
    },
    [handleContainerNetworkDisconnect, network.id, network.name]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDriverIcon = (driver: string) => {
    switch (driver) {
      case "bridge":
        return <FaExchangeAlt className="text-blue-500" />;
      case "host":
        return <FaGlobe className="text-green-500" />;
      case "overlay":
        return <FaNetworkWired className="text-purple-500" />;
      default:
        return <FaNetworkWired className="text-gray-500" />;
    }
  };

  const isBuiltInNetwork = ["bridge", "host", "none"].includes(network.name);
  const availableContainers = containers.filter(
    (container) =>
      !(network.containers || []).some((nc) => nc.id === container.id)
  );

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getDriverIcon(network.driver)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <span>{network.name}</span>
                {network.internal && (
                  <FaShieldAlt
                    className="text-orange-500 text-sm"
                    title="Internal Network"
                  />
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {network.driver} • {network.scope}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isBuiltInNetwork && (
              <>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Connect Container"
                >
                  <FaPlug className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Remove Network"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Network Details */}
        <div className="space-y-3">
          {/* IPAM Configuration */}
          {network.ipam?.config?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IP Configuration
              </h4>
              <div className="space-y-1">
                {network.ipam.config.map((config, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md"
                  >
                    {config.subnet && <div>Subnet: {config.subnet}</div>}
                    {config.gateway && <div>Gateway: {config.gateway}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Containers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              Connected Containers
              <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                {network.containers?.length || 0}
              </span>
            </h4>
            {(network.containers?.length || 0) > 0 ? (
              <div className="space-y-2">
                {network.containers?.map((container) => (
                  <div
                    key={container.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <BsCircleFill className="w-2 h-2 text-green-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {container.name}
                        </div>
                        {container.ipv4Address && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            IPv4: {container.ipv4Address}
                          </div>
                        )}
                        {container.ipv6Address && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            IPv6: {container.ipv6Address}
                          </div>
                        )}
                      </div>
                    </div>
                    {!isBuiltInNetwork && (
                      <button
                        onClick={() =>
                          handleDisconnect(container.id, container.name)
                        }
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Disconnect Container"
                      >
                        <FaUnlink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No containers connected
              </div>
            )}
          </div>

          {/* Network Properties */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Created:</span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(network.created)}
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                IPAM Driver:
              </span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {network.ipam?.driver || "default"}
              </div>
            </div>
          </div>

          {/* Network ID */}
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
            ID: {network.id?.substring(0, 12) || "N/A"}...
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Network"
        message={`Are you sure you want to remove the network "${network.name}"? This action cannot be undone.`}
        confirmText="Remove"
      />

      {/* Connect Container Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Connect Container to {network.name}
            </h3>

            {availableContainers.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Container
                  </label>
                  <select
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                    title="Select container to connect"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">
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
