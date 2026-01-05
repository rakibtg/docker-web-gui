import {
  FaBox,
  FaHdd,
  FaCode,
  FaArrowLeft,
  FaLayerGroup,
} from "react-icons/fa";

import { Button } from "../components";
import { Link } from "react-router-dom";
import { formatDate } from "../helpers";
import { useApp } from "../hooks/useApp";
import { useParams } from "react-router-dom";
import type { DockerImageDetails } from "../types";
import { PageWrapper } from "../components/PageWrapper";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RETRY_DELAY_MS = 500;
const MAX_REQUEST_ATTEMPTS = 3;
const RESPONSE_TIMEOUT_MS = 5000;

export function ImageDetails() {
  const requestAttemptsRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const { imageId } = useParams<{ imageId: string }>();
  const [error, setError] = useState<string | null>(null);
  const latestDataRef = useRef<DockerImageDetails | null>(null);
  const { requestImageDetails, websocket, isConnected } = useApp();
  const [data, setData] = useState<DockerImageDetails | null>(null);
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRequestTimeout = useCallback(() => {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, []);

  const sendImageDetailsRequest = useCallback(() => {
    if (!imageId) return;

    if (latestDataRef.current) {
      setIsLoading(false);
      return;
    }

    const canSend = websocket?.readyState === WebSocket.OPEN && isConnected;

    if (!canSend) {
      clearRequestTimeout();
      requestTimeoutRef.current = setTimeout(
        sendImageDetailsRequest,
        RETRY_DELAY_MS
      );
      return;
    }

    if (requestAttemptsRef.current >= MAX_REQUEST_ATTEMPTS) {
      clearRequestTimeout();
      setIsLoading(false);
      setError("Unable to load image details. Please try again.");
      return;
    }

    requestAttemptsRef.current += 1;
    setIsLoading(true);
    setError(null);
    console.log(
      `Requesting image details for: ${imageId} (attempt ${requestAttemptsRef.current}/${MAX_REQUEST_ATTEMPTS})`
    );
    requestImageDetails(imageId);

    clearRequestTimeout();
    requestTimeoutRef.current = setTimeout(() => {
      if (!latestDataRef.current) {
        sendImageDetailsRequest();
      }
    }, RESPONSE_TIMEOUT_MS);
  }, [
    clearRequestTimeout,
    imageId,
    isConnected,
    requestImageDetails,
    websocket,
  ]);

  // Reset and kick off load when the route changes
  useEffect(() => {
    latestDataRef.current = null;
    setData(null);
    setError(null);
    setIsLoading(false);
    requestAttemptsRef.current = 0;
    clearRequestTimeout();

    if (imageId) {
      sendImageDetailsRequest();
    }

    return clearRequestTimeout;
  }, [imageId, clearRequestTimeout, sendImageDetailsRequest]);

  // Retry when connection status changes and we still don't have data
  useEffect(() => {
    if (imageId && !latestDataRef.current) {
      sendImageDetailsRequest();
    }
  }, [imageId, isConnected, websocket, sendImageDetailsRequest]);

  // Listen for image details response
  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "image-details-result" && message.data) {
          const messageImageId = message.data.imageId || message.data.id;
          const shortMessageId = messageImageId
            ?.replace("sha256:", "")
            .substring(0, 12);
          const shortCurrentId = imageId
            ?.replace("sha256:", "")
            .substring(0, 12);

          // Match by exact ID or by short ID (first 12 chars of hash)
          if (
            messageImageId === imageId ||
            shortMessageId === imageId ||
            shortMessageId === shortCurrentId
          ) {
            console.log("✓ Received image data for:", imageId);
            latestDataRef.current = message.data;
            setData(message.data);
            setIsLoading(false);
            setError(null);
            requestAttemptsRef.current = 0;
            clearRequestTimeout();
          }
        }

        if (message.type === "error") {
          setIsLoading(false);
          setError(message.message || "Failed to load image details");
          clearRequestTimeout();
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    websocket.addEventListener("message", handleMessage);
    return () => {
      websocket.removeEventListener("message", handleMessage);
    };
  }, [imageId, websocket, clearRequestTimeout]);

  const formattedSize = useMemo(() => {
    if (!data?.size) return "Unknown";
    const sizeStr = data.size.toString();
    if (/[A-Za-z]/.test(sizeStr)) return sizeStr;
    const sizeNum = Number(sizeStr);
    if (Number.isNaN(sizeNum)) return "Unknown";
    if (sizeNum < 1024) return `${sizeNum} B`;
    if (sizeNum < 1024 * 1024) return `${(sizeNum / 1024).toFixed(1)} KB`;
    if (sizeNum < 1024 * 1024 * 1024)
      return `${(sizeNum / (1024 * 1024)).toFixed(1)} MB`;
    return `${(sizeNum / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, [data?.size]);

  const containerClass = "max-w-6xl mx-auto w-full space-y-6";

  if (!imageId) {
    return (
      <PageWrapper>
        <div className={containerClass}>
          <h1 className="text-xl font-bold text-gray-100">Image Details</h1>
          <p className="text-gray-400">No image ID provided.</p>
        </div>
      </PageWrapper>
    );
  }

  if (error && !data) {
    return (
      <PageWrapper>
        <div className={containerClass}>
          <div className="flex items-center gap-3">
            <Link
              to="/images"
              className="p-1.5 hover:bg-gray-800 rounded-md transition-colors text-gray-200"
            >
              <FaArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Image Details</h1>
              <p className="text-gray-400 text-sm">{imageId}</p>
            </div>
          </div>
          <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-md p-4">
            {error}
          </div>
          <Button
            onClick={sendImageDetailsRequest}
            variant="primary"
            size="lg"
            className="w-fit"
          >
            Retry
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if ((isLoading || !data) && !error) {
    return (
      <PageWrapper>
        <div className={containerClass}>
          <div className="p-4 sm:p-6 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <div>
                <p className="text-gray-100 font-semibold">
                  Loading image details...
                </p>
                <p className="text-gray-400 text-sm break-all">{imageId}</p>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <PageWrapper>
      <div className={containerClass}>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/images"
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors text-gray-200"
            title="Back to images"
          >
            <FaArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-gray-100 truncate">
                {data.repository || "Unknown repository"}
              </h1>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900 text-blue-200">
                {data.tag || "latest"}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-1 break-all">
              {data.imageId}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaBox className="text-blue-400" size={14} />
              <h2 className="text-sm font-semibold text-gray-100">
                Basic Info
              </h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Repository</span>
                <span className="font-mono">
                  {data.repository || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Tag</span>
                <span>{data.tag || "latest"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Size</span>
                <span>{formattedSize}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Created</span>
                <span className="text-right">
                  {formatDate(data.created || "")}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Parent</span>
                <span
                  className="font-mono truncate max-w-[180px]"
                  title={data.parent}
                >
                  {data.parent || "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaCode className="text-green-400" size={14} />
              <h2 className="text-sm font-semibold text-gray-100">Runtime</h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">OS</span>
                <span>{data.os || "Unknown"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Architecture</span>
                <span>{data.architecture || "Unknown"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">User</span>
                <span>{data.config?.user || "Default"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Working Dir</span>
                <span
                  className="font-mono truncate max-w-[180px]"
                  title={data.config?.workingDir}
                >
                  {data.config?.workingDir || "/"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Entrypoint</span>
                <span className="text-right">
                  {data.config?.entrypoint?.join(" ") || "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaLayerGroup className="text-purple-400" size={14} />
              <h2 className="text-sm font-semibold text-gray-100">Root FS</h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Type</span>
                <span>{data.rootFS?.type || "Unknown"}</span>
              </div>
              <div className="text-gray-400">Layers</div>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {data.rootFS?.layers?.length ? (
                  data.rootFS.layers.map((layer, idx) => (
                    <div
                      key={layer}
                      className="bg-gray-900/60 border border-gray-700 rounded px-2 py-1 font-mono text-xs text-gray-200 truncate"
                      title={layer}
                    >
                      {idx + 1}. {layer}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No layers reported.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaHdd className="text-orange-400" size={14} />
              <h2 className="text-sm font-semibold text-gray-100">Config</h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <div>
                <div className="text-gray-400 mb-1">CMD</div>
                <div className="font-mono text-xs bg-gray-900/60 border border-gray-700 rounded p-2">
                  {data.config?.cmd?.join(" ") || "Not set"}
                </div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Env</div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {data.config?.env?.length ? (
                    data.config.env.map((envVar, idx) => (
                      <div
                        key={`${envVar}-${idx}`}
                        className="font-mono text-xs bg-gray-900/60 border border-gray-700 rounded px-2 py-1 overflow-x-auto"
                      >
                        {envVar}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No environment variables.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaCode className="text-cyan-400" size={14} />
              <h2 className="text-sm font-semibold text-gray-100">Labels</h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2 max-h-56 overflow-y-auto">
              {data.config?.labels && Object.keys(data.config.labels).length ? (
                Object.entries(data.config.labels).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-3 bg-gray-900/60 border border-gray-700 rounded px-2 py-1"
                  >
                    <span className="font-mono text-xs text-blue-200">
                      {key}
                    </span>
                    <span className="font-mono text-xs text-gray-200 text-right">
                      {String(value)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No labels set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
