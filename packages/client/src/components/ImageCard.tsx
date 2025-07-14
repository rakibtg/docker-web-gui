import React, { useState, memo, useCallback } from "react";
import type { DockerImage } from "../types";
import { FaTrash, FaHistory, FaClock, FaHdd } from "react-icons/fa";
import { IoReloadCircle } from "react-icons/io5";

function CardActionButton({
  children,
  disabled = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`cursor-pointer w-18 p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400
      `}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ImageCardProps {
  image: DockerImage;
  onRemove?: (imageId: string, force?: boolean) => void;
  onViewHistory?: (imageId: string) => void;
  isRemoving?: boolean;
}

const ImageCard = memo(function ImageCard({
  image,
  onRemove,
  onViewHistory,
  isRemoving = false,
}: ImageCardProps) {
  const [localRemoving, setLocalRemoving] = useState(false);
  const [showForceOption, setShowForceOption] = useState(false);

  const handleRemove = useCallback(
    async (force: boolean = false) => {
      if (!onRemove) return;

      setLocalRemoving(true);
      try {
        await onRemove(image.imageId, force);
      } finally {
        setTimeout(() => {
          setLocalRemoving(false);
          setShowForceOption(false);
        }, 1000);
      }
    },
    [onRemove, image.imageId]
  );

  const handleViewHistory = useCallback(() => {
    onViewHistory?.(image.imageId);
  }, [onViewHistory, image.imageId]);

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

    // If it's already a relative time format (like "2 hours ago", "3 days ago"), return as is
    if (
      created.includes("ago") ||
      created.includes("minute") ||
      created.includes("hour") ||
      created.includes("day") ||
      created.includes("week") ||
      created.includes("month") ||
      created.includes("year")
    ) {
      return created;
    }

    try {
      const date = new Date(created);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return created; // Return original string if can't parse
      }
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return created; // Return original string if parsing fails
    }
  };

  return (
    <div className="bg-theme-card rounded shadow-md border-theme border p-4 pt-2.5 hover:shadow-lg transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center gap-2">
            <h3 className="text-lg font-semibold text-theme-primary truncate transition-colors">
              {image.repository}
            </h3>
            <span className="inline-flex text-xs px-2 py-1 rounded-full border border-blue-400/30 text-blue-100 bg-blue-500/20">
              {image.tag}
            </span>
          </div>
          <p
            className="text-sm text-theme-muted font-mono transition-colors flex items-center gap-1"
            title={`Image ID: ${image.imageId}`}
          >
            <span className="inline-block">
              {image.imageId.substring(0, 12)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-theme-muted">
          <FaHdd className="text-blue-400" />
          <span className="font-medium">Size:</span>
          <span>{formatSize(image.size)}</span>
        </div>
        <div className="flex items-center gap-2 text-theme-muted">
          <FaClock className="text-green-400" />
          <span className="font-medium">Created:</span>
          <span className="truncate" title={formatCreated(image.created)}>
            {formatCreated(image.created)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-theme">
        <div className="text-xs text-theme-muted">
          <span className="font-mono">{image.id}</span>
        </div>

        <div className="flex items-center gap-1">
          <CardActionButton
            onClick={handleViewHistory}
            title="View image history"
            disabled={localRemoving || isRemoving}
          >
            <FaHistory size={14} />
            <span className="text-xs mt-0.5">History</span>
          </CardActionButton>

          {!showForceOption ? (
            <CardActionButton
              onClick={() => handleRemove(false)}
              title="Remove image"
              disabled={localRemoving || isRemoving}
            >
              {localRemoving || isRemoving ? (
                <IoReloadCircle size={14} className="animate-spin" />
              ) : (
                <FaTrash size={14} />
              )}
              <span className="text-xs mt-0.5">Remove</span>
            </CardActionButton>
          ) : (
            <div className="flex gap-1">
              <CardActionButton
                onClick={() => handleRemove(false)}
                title="Remove image (normal)"
                disabled={localRemoving || isRemoving}
                className="text-orange-600 hover:text-orange-500"
              >
                <FaTrash size={12} />
                <span className="text-xs mt-0.5">Normal</span>
              </CardActionButton>
              <CardActionButton
                onClick={() => handleRemove(true)}
                title="Force remove image"
                disabled={localRemoving || isRemoving}
                className="text-red-600 hover:text-red-500"
              >
                <FaTrash size={12} />
                <span className="text-xs mt-0.5">Force</span>
              </CardActionButton>
            </div>
          )}

          {!showForceOption && (
            <CardActionButton
              onClick={() => setShowForceOption(true)}
              title="Show force remove option"
              disabled={localRemoving || isRemoving}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <span className="text-xs">⚙️</span>
            </CardActionButton>
          )}
        </div>
      </div>
    </div>
  );
});

export { ImageCard };
