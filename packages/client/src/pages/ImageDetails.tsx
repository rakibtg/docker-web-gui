import { useApp } from "../hooks/useApp";
import type { DockerImageDetails } from "../types";
import { useParams, useNavigate, Link } from "react-router-dom";
import { memo, useEffect, useState, useMemo, useCallback } from "react";

import {
  FaCog,
  FaBox,
  FaTag,
  FaCode,
  FaServer,
  FaTerminal,
  FaArrowLeft,
  FaLayerGroup,
} from "react-icons/fa";

import { formatDate } from "../helpers";
import { BsCircleFill } from "react-icons/bs";
import { PageWrapper } from "../components/PageWrapper";

const ImageDetails = memo(function ImageDetails() {
  const navigate = useNavigate();
  const { imageId } = useParams<{ imageId: string }>();
  const [imageNotFound, setImageNotFound] = useState(false);
  const [image, setImage] = useState<DockerImageDetails | null>(null);
  const { containers, images, loading, isConnected, websocket } = useApp();
  const [isLoadingImageDetails, setIsLoadingImageDetails] = useState(false);

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
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="Back to images"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-100">
            Loading Image
          </h1>
        </div>
        <div className="text-center py-8 lg:py-16">
          <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <p className="text-gray-400 text-sm lg:text-base">
            Loading image details...
          </p>
        </div>
      </div>
    );
  }

  if (imageNotFound) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="Back to images"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-100">
            Image Not Found
          </h1>
        </div>
        <div className="text-center py-8 lg:py-16">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100 mb-4">
            Image Not Found
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">
            The image with ID "{imageId}" could not be found.
          </p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Images
          </button>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="Back to images"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-100">
            Image Details
          </h1>
        </div>
        <div className="text-center py-8 lg:py-16">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-100 mb-4">
            No image data available
          </h1>
          <p className="text-gray-400 text-sm lg:text-base">
            Unable to load image information.
          </p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Images
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      {/* Compact Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            title="Back to images"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-gray-100 truncate">
                {image.repository}
              </h1>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900 text-blue-200">
                {image.tag}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-1">
              {image.imageId}
            </p>
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
      </div>
    </PageWrapper>
  );
});

export { ImageDetails };
