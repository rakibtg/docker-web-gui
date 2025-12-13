import { useApp } from "../hooks/useApp";
import type { DockerImageDetails } from "../types";
import { useParams, useNavigate, Link } from "react-router-dom";
import { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";

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
  const [requestedImageId, setRequestedImageId] = useState<string | null>(null);
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

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

  // Function to request image details with retry logic
  const requestImageDetails = useCallback(
    (targetImageId: string, isRetry: boolean = false) => {
      if (
        targetImageId &&
        websocket &&
        websocket.readyState === WebSocket.OPEN &&
        isConnected
      ) {
        const retryText = isRetry
          ? ` (retry ${retryCountRef.current}/${maxRetries})`
          : "";
        console.log(
          `Requesting image details for: ${targetImageId}${retryText}`
        );
        setIsLoadingImageDetails(true);
        setImageNotFound(false);
        setRequestedImageId(targetImageId);

        websocket.send(
          JSON.stringify({
            type: "get-image-details",
            imageId: targetImageId,
          })
        );

        // Set a timeout to retry or show error
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
        }
        requestTimeoutRef.current = setTimeout(() => {
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.warn(
              `Image details request timeout for: ${targetImageId}, retrying...`
            );
            requestImageDetails(targetImageId, true);
          } else {
            console.error(
              `Image details request failed after ${maxRetries} retries for: ${targetImageId}`
            );
            setIsLoadingImageDetails(false);
            setImageNotFound(true);
            retryCountRef.current = 0;
          }
        }, 5000); // 5 second timeout per attempt
      } else {
        console.warn("Cannot request image details - WebSocket not ready", {
          hasWebsocket: !!websocket,
          readyState: websocket?.readyState,
          isConnected,
        });
        // If websocket is not ready, try again after a short delay
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          requestTimeoutRef.current = setTimeout(() => {
            requestImageDetails(targetImageId, true);
          }, 1000);
        }
      }
    },
    [websocket, isConnected, maxRetries]
  );

  // Reset state when imageId changes
  useEffect(() => {
    console.log(`ImageDetails mounted/updated for imageId: ${imageId}`);
    setImage(null);
    setIsLoadingImageDetails(false);
    setImageNotFound(false);
    setRequestedImageId(null);
    retryCountRef.current = 0;

    // Clear any pending timeouts
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, [imageId]);

  // Main effect to check if image exists and request details
  useEffect(() => {
    // Don't do anything if we're still loading the initial data or no imageId
    if (!imageId || loading) {
      return;
    }

    // Don't proceed if websocket is not connected
    if (!isConnected || !websocket || websocket.readyState !== WebSocket.OPEN) {
      console.log("Waiting for WebSocket connection...");
      return;
    }

    // If we already have image details for this ID, don't request again
    if (
      image &&
      (image.imageId === imageId ||
        image.imageId?.startsWith(imageId) ||
        image.id === imageId)
    ) {
      return;
    }

    // Check if this image exists in the images list
    const foundImage = images.find(
      (img) =>
        img.imageId === imageId ||
        img.imageId.startsWith(imageId) ||
        img.id === imageId
    );

    if (foundImage) {
      // Image exists - request details if not already requested
      if (!isLoadingImageDetails && requestedImageId !== imageId) {
        console.log(`Found image in list, requesting details for: ${imageId}`);
        requestImageDetails(imageId);
      }
    } else if (images.length > 0) {
      // We have images list but this image is not in it
      console.log(`Image ${imageId} not found in images list`);
      setImageNotFound(true);
    }
  }, [imageId, images, loading, isConnected, websocket, image, isLoadingImageDetails, requestedImageId, requestImageDetails]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

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
              console.log(`Received image details for: ${imageId}`);
              setImage(message.data);
              setIsLoadingImageDetails(false);
              setImageNotFound(false);
              retryCountRef.current = 0;

              // Clear the timeout since we got a response
              if (requestTimeoutRef.current) {
                clearTimeout(requestTimeoutRef.current);
                requestTimeoutRef.current = null;
              }
            } else {
              console.log(
                `Received image details but ID doesn't match. Expected: ${imageId}, Got: ${messageImageId}`
              );
            }
          }
        }

        // Handle errors
        if (message.type === "error") {
          console.error("Received error message:", message.message);
          setIsLoadingImageDetails(false);
          setImageNotFound(true);
          retryCountRef.current = 0;

          // Clear the timeout
          if (requestTimeoutRef.current) {
            clearTimeout(requestTimeoutRef.current);
            requestTimeoutRef.current = null;
          }
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
