import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { DockerVolume } from "../types";
import { ConfirmationModal } from "./ConfirmationModal";
import { useApp } from "../hooks/useApp";
import { FaTrash, FaHdd, FaDatabase, FaDocker, FaCircle } from "react-icons/fa";
import { IoReloadCircle } from "react-icons/io5";
import { BsCircleFill } from "react-icons/bs";

function CardActionButton({
  children,
  disabled = false,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={`cursor-pointer px-2 py-1 text-white hover:bg-opacity-80 transition-colors rounded text-xs font-medium flex items-center gap-1 shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed ${className} ${
        !className.includes("bg-") ? "bg-red-600 hover:bg-red-700" : ""
      }`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

interface VolumeCardProps {
  volume: DockerVolume;
}

const VolumeCard = memo(function VolumeCard({ volume }: VolumeCardProps) {
  const { handleVolumeRemove } = useApp();
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = () => {
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    setIsRemoving(true);
    handleVolumeRemove(volume.name);
    setShowRemoveModal(false);
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

  const isInUse = volume.usedBy && volume.usedBy.length > 0;
  const usedByCount = volume.usedBy?.length || 0;

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg hover:shadow-md transition-shadow relative">
        {/* Header with name and status */}
        <div className="flex items-center justify-between mb-2 relative">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FaCircle
                className={`${
                  isInUse ? "text-green-400" : "text-gray-400"
                } flex-shrink-0`}
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
                <div className="flex flex-col items-center gap-1 p-1">
                  {isRemoving ? (
                    <IoReloadCircle size={12} className="animate-spin" />
                  ) : (
                    <FaTrash size={12} />
                  )}
                  <span className="text-xs">Remove</span>
                </div>
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
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Volume"
        message={`Are you sure you want to remove the volume "${volume.name}"?\n\n⚠️ This action cannot be undone and all data in the volume will be permanently lost.`}
        confirmText="Remove Volume"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
});

export { VolumeCard };
