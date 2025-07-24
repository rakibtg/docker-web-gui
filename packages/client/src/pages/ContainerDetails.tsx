import { memo, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import type { DockerContainerDetails } from "../types";
import {
  FaArrowLeft,
  FaClock,
  FaDocker,
  FaCircle,
  FaServer,
  FaTag,
  FaTerminal,
  FaUser,
  FaPlay,
  FaStop,
  FaRedo,
  FaCog,
  FaNetworkWired,
  FaHdd,
  FaCode,
  FaShieldAlt,
  FaHome,
  FaDesktop,
} from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";
import { formatDockerPort } from "../helpers/readablePort";

const ContainerDetails = memo(function ContainerDetails() {
  const { containerId } = useParams<{ containerId: string }>();
  const navigate = useNavigate();
  const {
    containers,
    loading,
    handleContainerToggle,
    handleContainerRestart,
    requestContainerDetails,
    isConnected,
    websocket,
  } = useApp();
  const [container, setContainer] = useState<DockerContainerDetails | null>(
    null
  );
  const [isLoadingContainerDetails, setIsLoadingContainerDetails] =
    useState(false);
  const [containerNotFound, setContainerNotFound] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (containerId) {
      const foundContainer = containers.find(
        (c) => c.id === containerId || c.id.startsWith(containerId)
      );
      if (foundContainer) {
        // If we have basic container info, use it temporarily while loading details
        setContainer((prev) => (prev?.id === foundContainer.id ? prev : null));
        setContainerNotFound(false);
      } else if (!isLoadingContainerDetails && !loading && isConnected) {
        setContainerNotFound(true);
      }
    }
  }, [containerId, containers, isLoadingContainerDetails, loading, isConnected]);

  // Reset states when containerId changes
  useEffect(() => {
    if (containerId) {
      setContainerNotFound(false);
      setIsLoadingContainerDetails(false);
      setContainer(null);
    }
  }, [containerId]);

  // Initial load effect - request container details when component mounts or containerId changes
  useEffect(() => {
    if (
      containerId &&
      !container &&
      isConnected &&
      !isLoadingContainerDetails
    ) {
      setIsLoadingContainerDetails(true);
      setContainerNotFound(false);
      console.log(`Requesting container details for: ${containerId}`);
      requestContainerDetails(containerId);
    }
  }, [containerId, requestContainerDetails, container, isConnected, isLoadingContainerDetails]);

  // Additional effect to handle connection changes - request container details when connected
  useEffect(() => {
    if (
      containerId &&
      isConnected &&
      !container &&
      !isLoadingContainerDetails &&
      !loading
    ) {
      setIsLoadingContainerDetails(true);
      setContainerNotFound(false);
      console.log(
        `Requesting container details on connection for: ${containerId}`
      );
      requestContainerDetails(containerId);
    }
  }, [isConnected, containerId, container, requestContainerDetails, isLoadingContainerDetails, loading]);

  // Handle timeout for loading
  useEffect(() => {
    if (isLoadingContainerDetails) {
      const timeout = setTimeout(() => {
        console.log(`Container details request timed out for: ${containerId}`);
        setIsLoadingContainerDetails(false);
        if (!container) {
          setContainerNotFound(true);
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingContainerDetails, container, containerId]);

  // Listen for container details response
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "container-details-result" && message.data) {
          if (
            message.data.id === containerId ||
            message.data.id.startsWith(containerId || "")
          ) {
            setContainer(message.data);
            setIsLoadingContainerDetails(false);
            setContainerNotFound(false);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => websocket.removeEventListener("message", handleMessage);
  }, [containerId, websocket]);

  // Reset loading state when loading changes
  useEffect(() => {
    if (!loading && isLoadingContainerDetails) {
      setIsLoadingContainerDetails(false);
    }
  }, [loading, isLoadingContainerDetails]);

  const handleBackClick = () => {
    navigate("/containers");
  };

  const handleToggle = async () => {
    if (!container) return;
    setIsToggling(true);
    try {
      await handleContainerToggle(container.id, container.state);
    } finally {
      setTimeout(() => setIsToggling(false), 1000);
    }
  };

  const handleRestart = async () => {
    if (!container) return;
    setIsRestarting(true);
    try {
      await handleContainerRestart(container.id);
    } finally {
      setTimeout(() => setIsRestarting(false), 2000);
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

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <FaPlay className="text-green-400" size={16} />;
      case "exited":
        return <FaStop className="text-red-400" size={16} />;
      case "paused":
        return <FaCircle className="text-yellow-400" size={16} />;
      default:
        return <FaDocker className="text-gray-400" size={16} />;
    }
  };

  if (!containerId) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100">
            Container Details
          </h1>
          <p className="mt-2 text-gray-400 text-sm lg:text-base">
            Detailed information about the selected container
          </p>
        </div>
        <div className="text-center py-8 lg:py-16">
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm lg:text-base"
          >
            Back to Containers
          </button>
        </div>
      </div>
    );
  }

  if (!container && (loading || isLoadingContainerDetails || !isConnected)) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100">
            Loading Container
          </h1>
          <p className="mt-2 text-gray-400 text-sm lg:text-base">
            {!isConnected
              ? "Connecting to server..."
              : "Please wait while we load the container details..."}
          </p>
        </div>
        <div className="text-center py-8 lg:py-16">
          <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-400 text-sm lg:text-base">
            {!isConnected
              ? "Establishing connection..."
              : "Loading container details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!container && containerNotFound) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center mb-4 lg:mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center text-gray-400 hover:text-blue-400 transition-colors mr-4"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Containers
          </button>
        </div>
        <div className="text-center py-8 lg:py-16">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100 mb-4">
            Container Not Found
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">
            The requested container "{containerId}" could not be found.
          </p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Containers
          </button>
        </div>
      </div>
    );
  }

  if (!container) {
    return null; // This should not happen based on the logic above, but keeps TypeScript happy
  }

  const isRunning = container.state === "running";
  const hasVolumes = container.mounts && container.mounts.length > 0;
  const hasNetworks = container.networks && container.networks.length > 0;
  const hasLabels =
    container.labels && Object.keys(container.labels).length > 0;
  const hasEnvVars = container.env && container.env.length > 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="Back to containers"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <BsCircleFill
                className={`${isRunning ? "text-green-400" : "text-red-400"}`}
                size={8}
              />
              <h1 className="text-lg sm:text-xl font-bold text-gray-100 truncate">
                {container.name}
              </h1>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isRunning
                    ? "bg-green-900 text-green-200"
                    : "bg-red-900 text-red-200"
                }`}
              >
                {container.state}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-1">
              {container.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 ${
                isRunning
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50`}
            >
              {isRunning ? (
                <FaStop className="w-3 h-3" />
              ) : (
                <FaPlay className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">
                {isToggling ? "..." : isRunning ? "Stop" : "Start"}
              </span>
            </button>
            {isRunning && (
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm transition-colors flex items-center gap-1"
              >
                <FaRedo
                  className={`w-3 h-3 ${isRestarting ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isRestarting ? "Restarting..." : "Restart"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Basic Info Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaServer className="text-blue-500" size={14} />
            <h3 className="font-medium text-gray-100 text-sm">Basic Info</h3>
          </div>
          <div className="space-y-2">
            <div className="text-xs">
              <span className="text-gray-400 block">Image</span>
              <Link
                to={`/images`}
                className="text-blue-400 hover:text-blue-300 block mt-0.5 break-all"
              >
                {container.image}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block">State</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {getStateIcon(container.state)}
                  <span className="text-gray-100">{container.state}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block">Status</span>
                <span className="text-gray-100 block mt-0.5">
                  {container.status}
                </span>
              </div>
            </div>
            {container.ports && (
              <div className="text-xs">
                <span className="text-gray-400 block">Ports</span>
                <span className="text-gray-100 block mt-0.5 font-mono">
                  {formatDockerPort(container.ports) || "None"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* System Info Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaCog className="text-purple-500" size={14} />
            <h3 className="font-medium text-gray-100 text-sm">System Info</h3>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block">Platform</span>
                <span className="text-gray-100 block mt-0.5">
                  {container.platform || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Architecture</span>
                <span className="text-gray-100 block mt-0.5">
                  {container.architecture || "Unknown"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block">Hostname</span>
                <span className="text-gray-100 block mt-0.5">
                  {container.hostname || "Default"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Privileged</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <FaShieldAlt
                    className={
                      container.privileged ? "text-red-400" : "text-green-400"
                    }
                    size={10}
                  />
                  <span className="text-gray-100">
                    {container.privileged ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Runtime Info Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <FaTerminal className="text-green-500" size={14} />
            <h3 className="font-medium text-gray-100 text-sm">Runtime Info</h3>
          </div>
          <div className="space-y-2">
            {container.user && (
              <div className="text-xs">
                <span className="text-gray-400 block">User</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <FaUser className="text-blue-400" size={10} />
                  <span className="text-gray-100">{container.user}</span>
                </div>
              </div>
            )}
            {container.workingDir && (
              <div className="text-xs">
                <span className="text-gray-400 block">Working Directory</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <FaHome className="text-yellow-400" size={10} />
                  <span className="text-gray-100 font-mono break-all">
                    {container.workingDir}
                  </span>
                </div>
              </div>
            )}
            {container.restartPolicy && (
              <div className="text-xs">
                <span className="text-gray-400 block">Restart Policy</span>
                <span className="text-gray-100 block mt-0.5">
                  {container.restartPolicy.name}
                  {container.restartPolicy.maximumRetryCount !== undefined &&
                    ` (max: ${container.restartPolicy.maximumRetryCount})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Created Info */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaClock className="text-blue-400" size={14} />
          <h3 className="font-medium text-gray-100 text-sm">Created</h3>
        </div>
        <div className="text-sm text-gray-100">
          {formatDate(container.created)}
        </div>
      </div>

      {/* Additional Sections - Only show if they have content */}
      <div className="space-y-3 sm:space-y-4">
        {/* Command */}
        {container.command && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaCode className="text-orange-500" size={14} />
              <h3 className="font-medium text-gray-100 text-sm">Command</h3>
            </div>
            <div className="bg-gray-700 p-3 rounded text-sm font-mono text-gray-100 break-all">
              {container.command}
            </div>
          </div>
        )}

        {/* Networks */}
        {hasNetworks && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaNetworkWired className="text-blue-500" size={14} />
              <h3 className="font-medium text-gray-100 text-sm">
                Networks ({container.networks?.length || 0})
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {container.networks?.map((network, index) => (
                <div
                  key={index}
                  className="bg-blue-900/20 border border-blue-700 p-3 rounded"
                >
                  <div className="text-sm">
                    <Link
                      to={`/networks`}
                      className="font-medium text-blue-200 hover:text-blue-100 break-all"
                    >
                      {network.name}
                    </Link>
                    {network.ipAddress && (
                      <div className="text-xs text-blue-300 mt-1">
                        IP: {network.ipAddress}
                      </div>
                    )}
                    {network.gateway && (
                      <div className="text-xs text-blue-300">
                        Gateway: {network.gateway}
                      </div>
                    )}
                    {network.macAddress && (
                      <div className="text-xs text-blue-300">
                        MAC: {network.macAddress}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mounts/Volumes */}
        {hasVolumes && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaHdd className="text-green-500" size={14} />
              <h3 className="font-medium text-gray-100 text-sm">
                Mounts ({container.mounts?.length || 0})
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {container.mounts?.map((mount, index) => (
                <div
                  key={index}
                  className="bg-green-900/20 border border-green-700 p-3 rounded"
                >
                  <div className="text-sm">
                    <div className="font-medium text-green-200 break-all">
                      {mount.name ? (
                        <Link to={`/volumes`} className="hover:text-green-100">
                          {mount.name}
                        </Link>
                      ) : (
                        mount.source
                      )}
                    </div>
                    <div className="text-xs text-green-300 mt-1">
                      Type: {mount.type}
                    </div>
                    <div className="text-xs text-green-300">
                      Mode: {mount.mode}
                    </div>
                    <div className="mt-2 pt-2 border-t border-green-700">
                      <span className="text-xs text-green-300 block">
                        Container Path
                      </span>
                      <span className="text-xs text-green-200 font-mono bg-green-800 px-1 py-0.5 rounded break-all block mt-0.5">
                        {mount.destination}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment Variables */}
        {hasEnvVars && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaDesktop className="text-yellow-500" size={14} />
              <h3 className="font-medium text-gray-100 text-sm">
                Environment Variables ({container.env?.length || 0})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {container.env?.map((envVar, index) => {
                const [key, ...valueParts] = envVar.split("=");
                const value = valueParts.join("=");
                return (
                  <div key={index} className="bg-gray-700 p-2 rounded text-xs">
                    <span className="text-gray-400 block font-medium">
                      {key}
                    </span>
                    <span className="text-gray-100 block mt-0.5 break-all">
                      {value || "<empty>"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Labels */}
        {hasLabels && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaTag className="text-orange-500" size={14} />
              <h3 className="font-medium text-gray-100 text-sm">
                Labels ({Object.keys(container.labels || {}).length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {Object.entries(container.labels || {}).map(([key, value]) => (
                <div key={key} className="bg-gray-700 p-2 rounded text-xs">
                  <span className="text-gray-400 block font-medium">{key}</span>
                  <span className="text-gray-100 block mt-0.5 break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { ContainerDetails };
