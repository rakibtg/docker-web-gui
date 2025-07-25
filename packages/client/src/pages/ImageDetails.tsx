import { memo, useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import type { DockerImageDetails, DockerContainer } from "../types";
import {
  FaArrowLeft,
  FaDocker,
  FaTag,
  FaServer,
  FaCode,
  FaBox,
  FaLayerGroup,
  FaCog,
  FaTerminal,
} from "react-icons/fa";
import { BsCircleFill } from "react-icons/bs";

const ImageDetails = memo(function ImageDetails() {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const { containers, images, loading, isConnected, websocket } = useApp();
  const [image, setImage] = useState<DockerImageDetails | null>(null);
  const [isLoadingImageDetails, setIsLoadingImageDetails] = useState(false);
  const [imageNotFound, setImageNotFound] = useState(false);

  // Memoized calculation of related containers
  const relatedContainers = useMemo(() => {
    if (!imageId || images.length === 0 || containers.length === 0) {
      return [];
    }

    const foundImage = images.find(
      (img) =>
        img.imageId === imageId ||
        img.imageId.startsWith(imageId) ||
        img.id === imageId
    );

    if (!foundImage) {
      return [];
    }

    return containers.filter(
      (container) =>
        container.image.includes(foundImage.repository) ||
        container.image.includes(foundImage.imageId) ||
        container.image === `${foundImage.repository}:${foundImage.tag}`
    );
  }, [imageId, images, containers]);

  // Function to request image details
  const requestImageDetails = useCallback(
    (targetImageId: string) => {
      if (
        targetImageId &&
        websocket &&
        websocket.readyState === WebSocket.OPEN &&
        isConnected
      ) {
        setIsLoadingImageDetails(true);
        setImageNotFound(false);
        websocket.send(
          JSON.stringify({
            type: "get-image-details",
            imageId: targetImageId,
          })
        );
      }
    },
    [websocket, isConnected]
  );

  // Reset state when imageId changes
  useEffect(() => {
    setImage(null);
    setIsLoadingImageDetails(false);
    setImageNotFound(false);
  }, [imageId]);

  // Check if image exists in the images list and request details if needed
  useEffect(() => {
    if (!imageId || !images.length || loading) return;

    const foundImage = images.find(
      (img) =>
        img.imageId === imageId ||
        img.imageId.startsWith(imageId) ||
        img.id === imageId
    );

    if (foundImage) {
      setImageNotFound(false);
      // Only request details if we don't have them and we're not already loading
      if (!image && !isLoadingImageDetails && isConnected && imageId) {
        requestImageDetails(imageId);
      }
    } else {
      setImageNotFound(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, images, loading, isConnected]); // Removed image and isLoadingImageDetails from deps to prevent loops

  // Additional effect to handle connection changes - request image details when connected
  useEffect(() => {
    if (
      imageId &&
      isConnected &&
      !image &&
      !isLoadingImageDetails &&
      !loading
    ) {
      setIsLoadingImageDetails(true);
      setImageNotFound(false);
      requestImageDetails(imageId);
    }
  }, [isConnected, imageId, image, requestImageDetails, isLoadingImageDetails, loading]);

  // Handle timeout for loading
  useEffect(() => {
    if (isLoadingImageDetails) {
      const timeout = setTimeout(() => {
        setIsLoadingImageDetails(false);
        setImageNotFound(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingImageDetails, imageId]);

  // Listen for image details response
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        // Handle any image-details-result message
        if (message.type === "image-details-result") {
          if (message.data) {
            // More flexible matching - handle short vs full image IDs
            const messageImageId = message.data.imageId || message.data.id;
            const shortMessageId = messageImageId
              ?.replace("sha256:", "")
              .substring(0, 12);
            const shortCurrentId = imageId
              ?.replace("sha256:", "")
              .substring(0, 12);

            const isMatch =
              messageImageId === imageId ||
              messageImageId?.includes(imageId || "") ||
              imageId?.includes(messageImageId || "") ||
              shortMessageId === shortCurrentId ||
              shortMessageId === imageId ||
              shortCurrentId === messageImageId;

            if (isMatch) {
              setImage(message.data);
              setIsLoadingImageDetails(false);
              setImageNotFound(false);
            }
          }
        }

        // Handle errors
        if (message.type === "error") {
          setIsLoadingImageDetails(false);
          setImageNotFound(true);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => websocket.removeEventListener("message", handleMessage);
  }, [imageId, websocket]);

  const handleBackClick = () => {
    navigate("/images");
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

  const formatSize = (size?: string) => {
    if (!size) return "Unknown";
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return "text-green-400";
      case "exited":
        return "text-red-400";
      case "created":
        return "text-yellow-400";
      case "restarting":
        return "text-orange-400";
      case "removing":
        return "text-purple-400";
      case "paused":
        return "text-blue-400";
      case "dead":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading || isLoadingImageDetails) {
    return (
      <div className="p-4">
        <div className="border-b border-gray-700 pb-4 mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Images
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Image Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Loading image details...</span>
        </div>
      </div>
    );
  }

  if (imageNotFound) {
    return (
      <div className="p-4">
        <div className="border-b border-gray-700 pb-4 mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Images
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Image Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaDocker className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-2 text-lg font-medium text-gray-100">
              Image not found
            </h3>
            <p className="mt-1 text-gray-400">
              The image with ID "{imageId}" could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="p-4">
        <div className="border-b border-gray-700 pb-4 mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Images
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Image Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaDocker className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-2 text-lg font-medium text-gray-100">
              No image data available
            </h3>
            <p className="mt-1 text-gray-400">
              Unable to load image information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Images
        </button>
        <div className="flex items-center gap-3 mb-2">
          <FaDocker className="text-blue-400 text-2xl" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {image.repository}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex text-sm px-2 py-1 rounded border border-blue-400/30 text-blue-100 bg-blue-500/20">
                <FaTag className="mr-1" />
                {image.tag}
              </span>
              <span className="text-gray-400 text-sm">
                ID: {image.imageId.substring(0, 12)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <FaBox className="mr-2 text-blue-400" />
            Basic Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Repository:</span>
              <span className="text-gray-100 font-mono">
                {image.repository}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tag:</span>
              <span className="text-gray-100">{image.tag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Image ID:</span>
              <span className="text-gray-100 font-mono break-all">
                {image.imageId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Size:</span>
              <span className="text-gray-100">{formatSize(image.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-gray-100">{formatDate(image.created)}</span>
            </div>
            {image.architecture && (
              <div className="flex justify-between">
                <span className="text-gray-400">Architecture:</span>
                <span className="text-gray-100">{image.architecture}</span>
              </div>
            )}
            {image.os && (
              <div className="flex justify-between">
                <span className="text-gray-400">OS:</span>
                <span className="text-gray-100">{image.os}</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration */}
        {image.config && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <FaCog className="mr-2 text-blue-400" />
              Configuration
            </h2>
            <div className="space-y-3">
              {image.config.user && (
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-gray-100">{image.config.user}</span>
                </div>
              )}
              {image.config.workingDir && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Working Directory:</span>
                  <span className="text-gray-100 font-mono">
                    {image.config.workingDir}
                  </span>
                </div>
              )}
              {image.config.hostname && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Hostname:</span>
                  <span className="text-gray-100">{image.config.hostname}</span>
                </div>
              )}
              {image.config.domainname && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Domain:</span>
                  <span className="text-gray-100">
                    {image.config.domainname}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Environment Variables */}
        {image.config?.env && image.config.env.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <FaCode className="mr-2 text-blue-400" />
              Environment Variables
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {image.config.env.map((env, index) => {
                const [key, ...valueParts] = env.split("=");
                const value = valueParts.join("=");
                return (
                  <div key={index} className="text-sm">
                    <span className="text-blue-400 font-mono">{key}</span>
                    <span className="text-gray-400">=</span>
                    <span className="text-gray-100 font-mono break-all">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Command & Entrypoint */}
        {(image.config?.cmd || image.config?.entrypoint) && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <FaTerminal className="mr-2 text-blue-400" />
              Command & Entrypoint
            </h2>
            <div className="space-y-3">
              {image.config.entrypoint && (
                <div>
                  <span className="text-gray-400 block mb-1">Entrypoint:</span>
                  <code className="text-gray-100 bg-gray-900 px-2 py-1 rounded text-sm font-mono block break-all">
                    {Array.isArray(image.config.entrypoint)
                      ? image.config.entrypoint.join(" ")
                      : image.config.entrypoint}
                  </code>
                </div>
              )}
              {image.config.cmd && (
                <div>
                  <span className="text-gray-400 block mb-1">Command:</span>
                  <code className="text-gray-100 bg-gray-900 px-2 py-1 rounded text-sm font-mono block break-all">
                    {Array.isArray(image.config.cmd)
                      ? image.config.cmd.join(" ")
                      : image.config.cmd}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Labels */}
        {image.config?.labels &&
          Object.keys(image.config.labels).length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                <FaTag className="mr-2 text-blue-400" />
                Labels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {Object.entries(image.config.labels).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-blue-400 font-mono">{key}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-gray-100 ml-1 break-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Root Filesystem */}
        {image.rootFS && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <FaLayerGroup className="mr-2 text-blue-400" />
              Root Filesystem
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-gray-100">{image.rootFS.type}</span>
              </div>
              {image.rootFS.layers && image.rootFS.layers.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-2">
                    Layers ({image.rootFS.layers.length}):
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {image.rootFS.layers.map((layer, index) => (
                      <div
                        key={index}
                        className="text-sm font-mono text-gray-300 break-all"
                      >
                        {layer}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Containers */}
        {relatedContainers.length > 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
              <FaServer className="mr-2 text-blue-400" />
              Containers using this image ({relatedContainers.length})
            </h2>
            <div className="space-y-3">
              {relatedContainers.map((container) => (
                <div
                  key={container.id}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <BsCircleFill
                      className={`text-xs ${getStatusColor(container.status)}`}
                    />
                    <div>
                      <Link
                        to={`/containers/${container.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {container.name}
                      </Link>
                      <div className="text-sm text-gray-400">
                        {container.id.substring(0, 12)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-100 capitalize">
                      {container.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(container.created)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { ImageDetails };
