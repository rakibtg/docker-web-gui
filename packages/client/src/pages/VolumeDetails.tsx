import { memo, useEffect, useState } from "react";
import { useRouter } from "../hooks/useRouter";
import { useApp } from "../hooks/useApp";
import type { DockerVolume } from "../types";
import {
  FaArrowLeft,
  FaHdd,
  FaClock,
  FaDatabase,
  FaDocker,
  FaCircle,
  FaTrash,
  FaFolder,
  FaTag,
  FaServer,
} from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";
import { ConfirmationModal } from "../components/ConfirmationModal";

const VolumeDetails = memo(function VolumeDetails() {
  const { getParam, navigate } = useRouter();
  const { volumes, handleVolumeRemove, requestVolumes } = useApp();
  const [volume, setVolume] = useState<DockerVolume | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const volumeId = getParam("volumeId");

  useEffect(() => {
    if (volumeId) {
      const foundVolume = volumes.find((v) => v.name === volumeId);
      setVolume(foundVolume || null);

      // If volume not found in current list, refresh volumes
      if (!foundVolume && volumes.length === 0) {
        requestVolumes();
      }
    }
  }, [volumeId, volumes, requestVolumes]);

  const handleBackClick = () => {
    navigate({ page: "volumes" });
  };

  const handleRemoveClick = () => {
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = () => {
    if (volume) {
      setIsRemoving(true);
      handleVolumeRemove(volume.name);
      setShowRemoveModal(false);
      // Navigate back to volumes page after removal
      setTimeout(() => {
        navigate({ page: "volumes" });
      }, 1000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };

      return date.toLocaleDateString("en-US", options);
    } catch {
      return dateString;
    }
  };

  const getDriverIcon = (driver: string) => {
    switch (driver) {
      case "local":
        return <FaHdd className="text-blue-400" size={16} />;
      case "nfs":
        return <FaDatabase className="text-green-400" size={16} />;
      default:
        return <FaDocker className="text-purple-400" size={16} />;
    }
  };

  if (!volumeId) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Volume Not Found
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            No volume ID was provided.
          </p>
        </div>
        <div className="text-center py-8 lg:py-16">
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm lg:text-base"
          >
            Back to Volumes
          </button>
        </div>
      </div>
    );
  }

  if (!volume) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Loading Volume
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Please wait while we load the volume details...
          </p>
        </div>
        <div className="text-center py-8 lg:py-16">
          <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Loading volume details...
          </p>
        </div>
      </div>
    );
  }

  const isInUse = volume.usedBy && volume.usedBy.length > 0;
  const usedByCount = volume.usedBy?.length || 0;

  return (
    <>
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex flex-col gap-4">
            {/* Top row with back button and title */}
            <div className="flex items-start gap-3">
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 mt-1"
                title="Back to volumes"
              >
                <FaArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FaCircle
                      className={`${
                        isInUse ? "text-green-400" : "text-gray-400"
                      } flex-shrink-0`}
                      size={10}
                    />
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      {volume.name}
                    </h1>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs sm:text-sm rounded self-start flex-shrink-0">
                    {isInUse ? "In Use" : "Unused"}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Docker volume details and configuration
                </p>
              </div>
            </div>

            {/* Action button row */}
            {!isInUse && (
              <div className="flex justify-start pl-14 sm:pl-0">
                <button
                  onClick={handleRemoveClick}
                  disabled={isRemoving}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">
                    {isRemoving ? "Removing..." : "Remove"}
                  </span>
                  <span className="hidden sm:inline">
                    {isRemoving ? "Removing..." : "Remove Volume"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Volume Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FaServer className="text-blue-500 flex-shrink-0" size={16} />
              <span>Basic Information</span>
            </h2>
            <div className="space-y-4">
              {" "}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Volume Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded break-all">
                    {volume.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Driver
                    </label>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {getDriverIcon(volume.driver)}
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {volume.driver}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scope
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                      {volume.scope}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                    {volume.size || "Unknown"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                    <FaClock
                      className="text-blue-400 flex-shrink-0"
                      size={14}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100 break-all">
                      {formatDate(volume.created)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mount Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FaFolder className="text-green-500 flex-shrink-0" size={16} />
              <span>Mount Information</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mount Point
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded font-mono break-all">
                  {volume.mountpoint || "Unknown"}
                </p>
              </div>
              <div>
                <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usage Status
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                  <BsCircleFill
                    className={`${
                      isInUse ? "text-green-400" : "text-gray-400"
                    } flex-shrink-0`}
                    size={8}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {isInUse
                      ? `Used by ${usedByCount} container(s)`
                      : "Not in use"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Options */}
        {Object.keys(volume.options || {}).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FaServer className="text-purple-500 flex-shrink-0" size={16} />
              <span>Driver Options</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {Object.entries(volume.options || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                >
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {key}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {Object.keys(volume.labels || {}).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FaTag className="text-orange-500 flex-shrink-0" size={16} />
              <span>Labels</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
              {Object.entries(volume.labels || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                >
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {key}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Containers */}
        {isInUse && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FaDocker className="text-blue-500 flex-shrink-0" size={16} />
              <span>Connected Containers ({usedByCount})</span>
            </h2>
            <div className="space-y-3 lg:space-y-4">
              {volume.usedBy?.map((usage, index) => (
                <div
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 lg:p-4 rounded-lg"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-blue-900 dark:text-blue-200 break-all text-sm lg:text-base">
                        {usage.containerName}
                      </h3>
                      <p className="text-xs lg:text-sm text-blue-700 dark:text-blue-300 break-all mt-1">
                        Container ID: {usage.containerId}
                      </p>
                    </div>
                    {usage.mountPath && (
                      <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Mount Path
                        </label>
                        <p className="text-xs lg:text-sm text-blue-900 dark:text-blue-200 font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded break-all">
                          {usage.mountPath}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

export { VolumeDetails };
