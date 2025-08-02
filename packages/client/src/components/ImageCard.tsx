import { Link } from "react-router-dom";
import { LuLayers3 } from "react-icons/lu";
import type { DockerImage } from "../types";
import { IoReloadCircle } from "react-icons/io5";
import { useState, memo, useCallback } from "react";
import { CardActionButton } from "./CardActionButton";
import { ConfirmationModal } from "./ConfirmationModal";
import { FaTrash, FaClock, FaHdd } from "react-icons/fa";

interface ImageCardProps {
  image: DockerImage;
  isRemoving?: boolean;
  onRemove?: (imageId: string, force?: boolean) => void;
}

const ImageCard = memo(function ImageCard({
  image,
  onRemove,
  isRemoving = false,
}: ImageCardProps) {
  const [localRemoving, setLocalRemoving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleRemove = useCallback(
    async (force: boolean = false) => {
      if (!onRemove) return;

      setLocalRemoving(true);
      setShowConfirmModal(false);
      try {
        await onRemove(image.imageId, force);
      } finally {
        setTimeout(() => {
          setLocalRemoving(false);
        }, 1000);
      }
    },
    [onRemove, image.imageId]
  );

  const handleRemoveClick = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    handleRemove(false);
  }, [handleRemove]);

  const handleConfirmForceRemove = useCallback(() => {
    handleRemove(true);
  }, [handleRemove]);

  const handleCancelRemove = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const formatSize = (size: string) => {
    if (size.includes("MB") || size.includes("GB") || size.includes("KB")) {
      return size;
    }
    // If size is just a number, assume it's bytes
    const sizeNum = parseFloat(size);
    if (sizeNum < 1024) return `${sizeNum} B`;
    if (sizeNum < 1024 * 1024) return `${(sizeNum / 1024).toFixed(1)} KB`;
    if (sizeNum < 1024 * 1024 * 1024)
      return `${(sizeNum / (1024 * 1024)).toFixed(1)} MB`;
    return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatCreated = (created: string) => {
    if (!created) return "Unknown";

    try {
      const date = new Date(created);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return created; // Return original string if can't parse
      }

      // Format as a full human-readable date
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
      return created; // Return original string if parsing fails
    }
  };

  return (
    <div className="bg-gray-800 rounded border-gray-600 border p-3 hover:shadow-md transition-all duration-200">
      {/* Header with image name, tag, and action button */}
      <div className="flex items-center justify-between mb-2 relative">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link
            to={`/images/${image.imageId}`}
            className="text-base font-medium text-gray-100 hover:text-blue-400 transition-colors truncate"
          >
            {image.repository}
          </Link>
          <span className="inline-flex text-xs px-1.5 py-0.5 rounded border border-blue-400/30 text-blue-100 bg-blue-500/20 shrink-0">
            {image.tag}
          </span>
        </div>

        <div className="absolute right-0 top-0">
          <CardActionButton
            onClick={handleRemoveClick}
            title="Remove image"
            disabled={localRemoving || isRemoving}
          >
            {localRemoving || isRemoving ? (
              <IoReloadCircle className="w-5 h-5 animate-spin" />
            ) : (
              <FaTrash className="w-5 h-5" />
            )}
            <p className="text-xs text-gray-100 pt-1">Remove</p>
          </CardActionButton>
        </div>
      </div>

      <div className="flex gap-3 text-xs text-gray-400">
        <div
          className="flex items-center gap-1"
          title={`Image ID: ${image.imageId}`}
        >
          <LuLayers3 className="text-blue-400" size={10} />
          {image.imageId.substring(0, 12)}
        </div>

        <div className="flex items-center gap-1">
          <FaHdd className="text-blue-400" size={10} />
          <span>Size: {formatSize(image.size)}</span>
        </div>

        <div className="flex items-center gap-1">
          <FaClock className="text-blue-400" size={10} />
          <span title={formatCreated(image.created)}>
            Created: {formatCreated(image.created)}
          </span>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        onConfirmWithForce={handleConfirmForceRemove}
        title="Remove Docker Image"
        message={`Are you sure you want to remove the image "${image.repository}:${image.tag}"? This action cannot be undone.`}
        confirmText="Remove"
        confirmWithForceText="Force Remove"
        type="danger"
        showForceOption={true}
      />
    </div>
  );
});

export { ImageCard };
