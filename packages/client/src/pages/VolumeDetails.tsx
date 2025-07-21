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
  const {
    volumes,
    volumesLoading,
    handleVolumeRemove,
    requestVolumeDetails,
    isConnected,
  } = useApp();
  const [volume, setVolume] = useState<DockerVolume | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoadingVolumeDetails, setIsLoadingVolumeDetails] = useState(false);
  const [volumeNotFound, setVolumeNotFound] = useState(false);

  const volumeId = getParam("volumeId");

  useEffect(() => {
    if (volumeId) {
      const foundVolume = volumes.find((v) => v.name === volumeId);
      if (foundVolume) {
        setVolume(foundVolume);
        setVolumeNotFound(false);
        setIsLoadingVolumeDetails(false);
      } else if (!isLoadingVolumeDetails && !volumesLoading && isConnected) {
        // Only set not found if we're not currently loading AND we're connected
        // This prevents showing "not found" when we haven't tried to load yet
        setVolumeNotFound(true);
      }
    }
  }, [volumeId, volumes, isLoadingVolumeDetails, volumesLoading, isConnected]);

  // Reset states when volumeId changes
  useEffect(() => {
    if (volumeId) {
      setVolumeNotFound(false);
      setIsLoadingVolumeDetails(false);
      setVolume(null);
    }
  }, [volumeId]);

  // Initial load effect - request volume details when component mounts or volumeId changes
  useEffect(() => {
    if (volumeId && !volume && isConnected && !isLoadingVolumeDetails) {
      setIsLoadingVolumeDetails(true);
      setVolumeNotFound(false);
      console.log(`Requesting volume details for: ${volumeId}`);
      requestVolumeDetails(volumeId);
    }
  }, [volumeId, requestVolumeDetails, volume, isConnected, isLoadingVolumeDetails]);

  // Additional effect to handle connection changes - request volume details when connected
  useEffect(() => {
    if (
      volumeId &&
      isConnected &&
      !volume &&
      !isLoadingVolumeDetails &&
      !volumesLoading
    ) {
      setIsLoadingVolumeDetails(true);
      setVolumeNotFound(false);
      console.log(`Requesting volume details on connection for: ${volumeId}`);
      requestVolumeDetails(volumeId);
    }
  }, [isConnected, volumeId, volume, requestVolumeDetails, isLoadingVolumeDetails, volumesLoading]);

  // Handle timeout for loading
  useEffect(() => {
    if (isLoadingVolumeDetails) {
      const timeout = setTimeout(() => {
        console.log(`Volume details request timed out for: ${volumeId}`);
        setIsLoadingVolumeDetails(false);
        if (!volume) {
          setVolumeNotFound(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingVolumeDetails, volume, volumeId]);

  // Reset loading state when volumesLoading changes
  useEffect(() => {
    if (!volumesLoading && isLoadingVolumeDetails) {
      setIsLoadingVolumeDetails(false);
    }
  }, [volumesLoading, isLoadingVolumeDetails]);

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

  if (!volume && (volumesLoading || isLoadingVolumeDetails || !isConnected)) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Loading Volume
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            {!isConnected
              ? "Connecting to server..."
              : "Please wait while we load the volume details..."}
          </p>
        </div>
        <div className="text-center py-8 lg:py-16">
          <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            {!isConnected
              ? "Establishing connection..."
              : "Loading volume details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!volume && volumeNotFound) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center mb-4 lg:mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Volumes
          </button>
        </div>
        <div className="text-center py-8 lg:py-16">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Volume Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            The requested volume "{volumeId}" could not be found.
          </p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Volumes
          </button>
        </div>
      </div>
    );
  }

  if (!volume) {
    return null; // This should not happen based on the logic above, but keeps TypeScript happy
  }

  const isInUse = volume.usedBy && volume.usedBy.length > 0;
  const usedByCount = volume.usedBy?.length || 0;

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleBackClick}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Back to volumes"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <FaCircle
                  className={`${isInUse ? "text-green-400" : "text-gray-400"}`}
                  size={8}
                />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {volume.name}
                </h1>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    isInUse
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {isInUse ? "In Use" : "Unused"}
                </span>
                {!isInUse && (
                  <button
                    onClick={handleRemoveClick}
                    disabled={isRemoving}
                    className="ml-auto px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <FaTrash className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {isRemoving ? "Removing..." : "Remove"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaServer className="text-blue-500" size={14} />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Basic Info
              </h3>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">
                    Driver
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getDriverIcon(volume.driver)}
                    <span className="text-gray-900 dark:text-gray-100">
                      {volume.driver}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">
                    Scope
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 block mt-0.5">
                    {volume.scope}
                  </span>
                </div>
              </div>
              <div className="text-xs">
                <span className="text-gray-600 dark:text-gray-400 block">
                  Size
                </span>
                <span className="text-gray-900 dark:text-gray-100 block mt-0.5">
                  {volume.size || "Unknown"}
                </span>
              </div>
            </div>
          </div>

          {/* Mount Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFolder className="text-green-500" size={14} />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Mount Info
              </h3>
            </div>
            <div className="space-y-2">
              <div className="text-xs">
                <span className="text-gray-600 dark:text-gray-400 block">
                  Mount Point
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-xs block mt-0.5 break-all">
                  {volume.mountpoint || "Unknown"}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-gray-600 dark:text-gray-400 block">
                  Status
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <BsCircleFill
                    className={`${
                      isInUse ? "text-green-400" : "text-gray-400"
                    }`}
                    size={6}
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    {isInUse ? `${usedByCount} container(s)` : "Not in use"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Created Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <FaClock className="text-blue-400" size={14} />
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                Created
              </h3>
            </div>
            <div className="text-xs">
              <span className="text-gray-900 dark:text-gray-100 block">
                {formatDate(volume.created)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Sections - Only show if they have content */}
        <div className="space-y-3 sm:space-y-4">
          {/* Driver Options */}
          {Object.keys(volume.options || {}).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaServer className="text-purple-500" size={14} />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Driver Options
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {Object.entries(volume.options || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 block font-medium">
                      {key}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 block mt-0.5 break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {Object.keys(volume.labels || {}).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaTag className="text-orange-500" size={14} />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Labels
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {Object.entries(volume.labels || {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 block font-medium">
                      {key}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 block mt-0.5 break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Containers */}
          {isInUse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaDocker className="text-blue-500" size={14} />
                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Connected Containers ({usedByCount})
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {volume.usedBy?.map((usage, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 dark:text-blue-200 break-all">
                        {usage.containerName}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 break-all mt-1">
                        ID: {usage.containerId}
                      </div>
                      {usage.mountPath && (
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-xs text-blue-700 dark:text-blue-300 block">
                            Mount Path
                          </span>
                          <span className="text-xs text-blue-900 dark:text-blue-200 font-mono bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded break-all block mt-0.5">
                            {usage.mountPath}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

export { VolumeDetails };
