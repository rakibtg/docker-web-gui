import {
  FaHdd,
  FaClock,
  FaGlobe,
  FaTrash,
  FaShieldAlt,
  FaExchangeAlt,
  FaNetworkWired,
} from "react-icons/fa";

import { formatDate } from "../helpers";
import { useApp } from "../hooks/useApp";
import type { DockerNetwork } from "../types";
import { BsCircleFill } from "react-icons/bs";
import { IoReloadCircle } from "react-icons/io5";
import { memo, useState, useCallback } from "react";
import { CardActionButton } from "./CardActionButton";
import { ConfirmationModal } from "./ConfirmationModal";

interface NetworkCardProps {
  network: DockerNetwork;
}

const NetworkCard = memo(function NetworkCard({ network }: NetworkCardProps) {
  const { handleNetworkRemove } = useApp();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  
  const subnet = network.ipam?.config?.[0]?.subnet;
  const connectedCount = network.containers?.length || 0;
  const isBuiltInNetwork = ["bridge", "host", "none"].includes(network.name);

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
              <CardActionButton
                onClick={() => setShowDeleteModal(true)}
                title="Remove network"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <IoReloadCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <FaTrash className="w-5 h-5" />
                )}
                <p className="text-xs text-gray-100 pt-1">Remove</p>
              </CardActionButton>
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
            <span title={formatDate(network.created, true)}>
              Created: {formatDate(network.created, true)}
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
        type="danger"
        confirmText="Remove"
        title="Remove Network"
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        message={`Are you sure you want to remove the network "${network.name}"? This action cannot be undone.`}
      />
    </>
  );
});

export { NetworkCard };
