import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import type { DockerVolume } from "../types";
import { BsCircleFill } from "react-icons/bs";
import { IoReloadCircle } from "react-icons/io5";
import { CardActionButton } from "./CardActionButton";
import { ConfirmationModal } from "./ConfirmationModal";
import { FaTrash, FaHdd, FaDatabase, FaDocker, FaCircle } from "react-icons/fa";

interface VolumeCardProps {
  volume: DockerVolume;
}

const VolumeCard = memo(function VolumeCard({ volume }: VolumeCardProps) {
  const { handleVolumeRemove } = useApp();
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const handleRemoveClick = () => {
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    setIsRemoving(true);
    setShowRemoveModal(false);
    handleVolumeRemove(volume.name);
    // Reset removing state after a delay
    setTimeout(() => setIsRemoving(false), 2000);
  };

  const getDriverIcon = (driver: string) => {
    switch (driver) {
      case "local":
        return <FaHdd className="text-blue-400" size={10} />;
      case "nfs":
        return <FaDatabase className="text-green-400" size={10} />;
      default:
        return <FaDocker className="text-purple-400" size={10} />;
    }
  };

  const usedByCount = volume.usedBy?.length || 0;
  const isInUse = volume.usedBy && volume.usedBy.length > 0;

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-sm hover:shadow-md transition-shadow relative">
        {/* Header with name and status */}
        <div className="flex items-center justify-between mb-2 relative">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FaCircle
                className={`${
                  isInUse ? "text-green-400" : "text-gray-400"
                } shrink-0`}
                size={8}
              />
              <Link
                to={`/volumes/${volume.name}`}
                className="text-gray-100 font-medium text-sm truncate hover:text-blue-400 transition-colors"
              >
                {volume.name}
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 flex items-center gap-1">
            {!isInUse && (
              <CardActionButton
                onClick={handleRemoveClick}
                title="Remove volume"
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

        {/* Volume details in minimal format */}
        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
          <div
            className="flex items-center gap-1"
            title={`Driver: ${volume.driver}`}
          >
            {getDriverIcon(volume.driver)}
            {volume.driver}
          </div>

          <div className="flex items-center gap-1">
            <BsCircleFill className="text-blue-400" size={8} />
            <span>Used by: {usedByCount} containers</span>
          </div>

          {volume.size && volume.size !== "Unknown" && (
            <div className="flex items-center gap-1">
              <FaHdd className="text-orange-400" size={10} />
              <span>Size: {volume.size}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        type="danger"
        cancelText="Cancel"
        title="Remove Volume"
        isOpen={showRemoveModal}
        confirmText="Remove Volume"
        onConfirm={handleConfirmRemove}
        onClose={() => setShowRemoveModal(false)}
        message={`Are you sure you want to remove the volume "${volume.name}"?\n\n⚠️ This action cannot be undone and all data in the volume will be permanently lost.`}
      />
    </>
  );
});

export { VolumeCard };
