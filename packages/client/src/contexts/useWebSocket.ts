import { useState, useRef, useEffect, useCallback } from "react";
import type {
  ContainerWithStats,
  DockerImage,
  DockerNetwork,
  DockerVolume,
} from "../types";
import type { ImageHistoryState } from "./types";

interface UseWebSocketProps {
  setContainers: React.Dispatch<React.SetStateAction<ContainerWithStats[]>>;
  setImages: React.Dispatch<React.SetStateAction<DockerImage[]>>;
  setNetworks: React.Dispatch<React.SetStateAction<DockerNetwork[]>>;
  setVolumes: React.Dispatch<React.SetStateAction<DockerVolume[]>>;
  setImageHistory: React.Dispatch<React.SetStateAction<ImageHistoryState>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setDockerAvailable: React.Dispatch<React.SetStateAction<boolean | null>>;
  setDockerMessage: React.Dispatch<React.SetStateAction<string>>;
  setLastUpdate: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setImagesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNetworksLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setVolumesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setIsStatsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  setIPAccessDenied: React.Dispatch<React.SetStateAction<boolean>>;
  setUserIP: React.Dispatch<React.SetStateAction<string | null>>;
  dockerAvailable: boolean | null;
  isConnected: boolean;
  isStatsStreaming: boolean;
}

export function useWebSocket({
  setContainers,
  setImages,
  setNetworks,
  setVolumes,
  setImageHistory,
  setIsConnected,
  setDockerAvailable,
  setDockerMessage,
  setLastUpdate,
  setLoading,
  setImagesLoading,
  setNetworksLoading,
  setVolumesLoading,
  setError,
  setIsStatsStreaming,
  setIPAccessDenied,
  setUserIP,
  dockerAvailable,
  isConnected,
  isStatsStreaming,
}: UseWebSocketProps) {
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // Refs for WebSocket management
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isPageVisibleRef = useRef(true);
  const shouldReconnectRef = useRef(true);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const lastStatsUpdateRef = useRef<{ [containerId: string]: number }>({});
  const statsUpdateThrottleMs = 1000; // Throttle stats updates to once per second

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    // Clear stats throttling cache
    lastStatsUpdateRef.current = {};
  }, []);

  // Function to send messages to server
  const sendMessage = useCallback(
    (message: object) => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
        return true;
      }
      return false;
    },
    [websocket]
  );

  // Function to start stats streaming
  const startStatsStreaming = useCallback(() => {
    if (
      dockerAvailable &&
      isConnected &&
      websocket?.readyState === WebSocket.OPEN
    ) {
      const sent = sendMessage({ type: "start-stats-streaming" });
      if (!sent) {
        console.warn("Failed to start stats streaming - not connected");
      }
    }
  }, [sendMessage, dockerAvailable, isConnected, websocket]);

  // Function to stop stats streaming
  const stopStatsStreaming = useCallback(() => {
    if (websocket?.readyState === WebSocket.OPEN) {
      sendMessage({ type: "stop-stats-streaming" });
    }
  }, [sendMessage, websocket]);

  // Check IP access before attempting WebSocket connection
  const checkIPAccess = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ip-access', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 403) {
        const errorData = await response.json();
        setIPAccessDenied(true);
        setError(errorData.message || 'Access denied from your IP address');
        return false;
      }

      if (!response.ok) {
        console.warn('Failed to check IP access, proceeding with connection');
        return true; // Allow connection attempt on network errors
      }

      const data = await response.json();
      setUserIP(data.ip);
      
      if (!data.allowed) {
        setIPAccessDenied(true);
        setError('Access denied from your IP address');
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Failed to check IP access:', err);
      return true; // Allow connection attempt on network errors
    }
  }, [setIPAccessDenied, setUserIP, setError]);

  // WebSocket connection management
  useEffect(() => {
    let ws: WebSocket;

    const connect = async () => {
      // Don't reconnect if component is unmounting
      if (!shouldReconnectRef.current) {
        return;
      }

      // Check IP access before connecting
      const ipAllowed = await checkIPAccess();
      if (!ipAllowed) {
        console.log('IP access denied, not attempting WebSocket connection');
        return;
      }

      // Use current host for WebSocket connection (works for both dev and prod)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = import.meta.env.DEV
        ? "localhost:8080"
        : window.location.host;
      const wsUrl = `${protocol}//${host}`;

      console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);
      websocketRef.current = ws;
      setWebsocket(ws);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError("");
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);

        // Request containers list on connection
        setTimeout(() => {
          if (isPageVisibleRef.current && ws.readyState === WebSocket.OPEN) {
            setLoading(true);
            ws.send(JSON.stringify({ type: "get-containers" }));
          }
        }, 500);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Only log non-heartbeat messages to reduce console spam
          if (message.type !== "pong" && message.type !== "container-stats") {
            console.log("Received message:", message);
          }

          switch (message.type) {
            case "containers-list":
              if (Array.isArray(message.data)) {
                setContainers(message.data);
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              setLoading(false);
              break;

            case "images-list":
              if (Array.isArray(message.data)) {
                setImages(message.data);
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              setImagesLoading(false);
              break;

            case "container-stats": {
              // Update specific container stats in real-time with throttling
              const containerWithStats = message.data;
              if (containerWithStats) {
                const containerId =
                  containerWithStats.id || containerWithStats.name;
                const now = Date.now();
                const lastUpdate = lastStatsUpdateRef.current[containerId] || 0;

                // Throttle updates to prevent excessive re-renders
                if (now - lastUpdate < statsUpdateThrottleMs) {
                  return;
                }

                lastStatsUpdateRef.current[containerId] = now;

                setContainers((prevContainers) => {
                  return prevContainers.map((container) => {
                    if (
                      container.id === containerWithStats.id ||
                      container.name === containerWithStats.name
                    ) {
                      return { ...container, ...containerWithStats };
                    }
                    return container;
                  });
                });
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              break;
            }

            case "stats-streaming-started":
              console.log("Stats streaming started:", message.message);
              setIsStatsStreaming(true);
              break;

            case "stats-streaming-stopped":
              console.log("Stats streaming stopped:", message.message);
              setIsStatsStreaming(false);
              break;

            case "docker-status":
              setDockerAvailable(message.available || false);
              if (message.message) {
                setDockerMessage(message.message);
              }
              break;

            case "error":
              console.error("Server error:", message.message);
              setError(message.message || "Unknown error occurred");
              setLoading(false);
              break;

            case "welcome":
              console.log("Welcome message:", message.message);
              break;

            case "pong":
              // Heartbeat response - connection is alive (no logging to reduce spam)
              break;

            case "container-action-result": {
              const actionResult = message;
              const {
                action,
                containerId,
                success,
                message: actionMessage,
              } = actionResult;
              console.log(`Container ${action} result:`, {
                containerId,
                success,
                message: actionMessage,
              });

              if (success) {
                // Container action succeeded
              } else {
                setError(actionMessage || `Failed to ${action} container`);
              }
              break;
            }

            case "image-action-result": {
              const actionResult = message;
              const {
                action,
                imageId,
                imageName,
                success,
                message: actionMessage,
              } = actionResult;
              console.log(`Image ${action} result:`, {
                imageId: imageId || imageName,
                success,
                message: actionMessage,
              });

              if (success) {
                // Refresh images list when action succeeds
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "get-images" }));
                }
              } else {
                setError(actionMessage || `Failed to ${action} image`);
              }
              break;
            }

            case "image-history-result": {
              const historyResult = message;
              console.log("Image history result:", historyResult);

              if (historyResult.success && historyResult.data) {
                setImageHistory((prev) => ({
                  ...prev,
                  layers: historyResult.data,
                  loading: false,
                }));
              } else {
                setImageHistory((prev) => ({
                  ...prev,
                  layers: [],
                  loading: false,
                }));
                setError(
                  historyResult.message || "Failed to get image history"
                );
              }
              break;
            }

            case "networks-result":
              if (Array.isArray(message.data)) {
                setNetworks(message.data);
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              setNetworksLoading(false);
              break;

            case "volumes-result":
              if (Array.isArray(message.data)) {
                setVolumes(message.data);
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              setVolumesLoading(false);
              break;

            case "volume-details-result":
              if (message.data) {
                // Update the single volume in the volumes array, or add it if it doesn't exist
                setVolumes((currentVolumes) => {
                  const existingVolumeIndex = currentVolumes.findIndex(
                    (volume) => volume.name === message.data.name
                  );

                  if (existingVolumeIndex >= 0) {
                    // Update existing volume
                    return currentVolumes.map((volume) => {
                      if (volume.name === message.data.name) {
                        return { ...volume, ...message.data };
                      }
                      return volume;
                    });
                  } else {
                    // Add new volume if it doesn't exist
                    return [...currentVolumes, message.data];
                  }
                });
                setLastUpdate(message.timestamp || new Date().toISOString());
              }
              setVolumesLoading(false);
              break;

            case "volume-remove-result":
              console.log("Volume remove result:", message);
              if (message.success && ws.readyState === WebSocket.OPEN) {
                // Refresh volumes list
                ws.send(JSON.stringify({ type: "get-volumes" }));
              }
              break;

            case "volumes-prune-result":
              console.log("Volumes prune result:", message);
              if (message.success && ws.readyState === WebSocket.OPEN) {
                // Refresh volumes list
                ws.send(JSON.stringify({ type: "get-volumes" }));
              }
              break;

            case "container-network-connect-result":
              console.log("Container network connect result:", message);
              if (message.success && ws.readyState === WebSocket.OPEN) {
                // Refresh networks list to update container connections
                ws.send(JSON.stringify({ type: "get-networks" }));
              }
              break;

            case "container-network-disconnect-result":
              console.log("Container network disconnect result:", message);
              if (message.success && ws.readyState === WebSocket.OPEN) {
                // Refresh networks list to update container connections
                ws.send(JSON.stringify({ type: "get-networks" }));
              }
              break;

            case "network-created":
            case "network-removed":
            case "container-connected-to-network":
            case "container-disconnected-from-network":
              // Auto-refresh networks when other clients make changes
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "get-networks" }));
              }
              break;

            // Terminal-related messages (handled by Terminal components)
            case "terminal-data":
            case "logs-data":
            case "terminal-disconnected":
            case "logs-disconnected":
            case "terminal-error":
            case "logs-error":
              // These messages are handled by individual Terminal components
              // No action needed at the global WebSocket level
              break;

            default:
              console.log("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        setIsStatsStreaming(false);

        // Clean up heartbeat
        cleanup();

        // Check if closure was due to IP restriction
        if (event.code === 1008 && event.reason === "IP_NOT_ALLOWED") {
          console.log("WebSocket closed due to IP restriction");
          setIPAccessDenied(true);
          setError("Access denied from your IP address");
          shouldReconnectRef.current = false; // Prevent reconnection attempts
          return;
        }

        // Only attempt to reconnect if we should reconnect and haven't exceeded max attempts
        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              connect();
            }
          }, delay);
        } else {
          console.log(
            "Max reconnection attempts reached or reconnect disabled"
          );
          setError("Connection lost. Please refresh the page to reconnect.");
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    };

    // Initialize page visibility state
    isPageVisibleRef.current = !document.hidden;
    shouldReconnectRef.current = true;

    connect();

    return () => {
      console.log("Cleaning up WebSocket connection");

      // Signal that we shouldn't reconnect
      shouldReconnectRef.current = false;

      // Clean up timers and intervals
      cleanup();

      // Close the WebSocket connection
      if (ws) {
        ws.onclose = null; // Prevent reconnect
        ws.close(1000, "Component unmounting");
      }

      setIsConnected(false);
      setIsStatsStreaming(false);
    };
  }, [
    cleanup,
    checkIPAccess,
    setContainers,
    setImages,
    setNetworks,
    setVolumes,
    setImageHistory,
    setIsConnected,
    setDockerAvailable,
    setDockerMessage,
    setLastUpdate,
    setLoading,
    setImagesLoading,
    setNetworksLoading,
    setVolumesLoading,
    setError,
    setIsStatsStreaming,
    setIPAccessDenied,
    setUserIP,
  ]);

  // Handle page visibility change to pause/resume stats streaming
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasVisible = isPageVisibleRef.current;
      isPageVisibleRef.current = !document.hidden;

      // Only log significant changes to reduce console spam
      if (wasVisible !== isPageVisibleRef.current) {
        console.log(
          `Page visibility changed: ${wasVisible ? "visible" : "hidden"} -> ${
            isPageVisibleRef.current ? "visible" : "hidden"
          }`
        );
      }

      if (isPageVisibleRef.current && !wasVisible) {
        // Page became visible - use refs to get current values
        const currentWs = websocketRef.current;
        if (currentWs?.readyState === WebSocket.OPEN) {
          // Refresh containers when page becomes visible
          setLoading(true);
          currentWs.send(JSON.stringify({ type: "get-containers" }));

          // Start stats streaming if conditions are met
          setTimeout(() => {
            if (currentWs.readyState === WebSocket.OPEN) {
              currentWs.send(JSON.stringify({ type: "start-stats-streaming" }));
            }
          }, 100);
        }
      } else if (!isPageVisibleRef.current && wasVisible) {
        // Page became hidden
        const currentWs = websocketRef.current;
        if (currentWs?.readyState === WebSocket.OPEN) {
          console.log("Page became hidden, stopping stats streaming");
          currentWs.send(JSON.stringify({ type: "stop-stats-streaming" }));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setLoading]); // Include setLoading since we use refs

  // Start stats streaming when Docker is available and connected
  useEffect(() => {
    if (
      dockerAvailable &&
      isConnected &&
      !isStatsStreaming &&
      !document.hidden &&
      websocket?.readyState === WebSocket.OPEN
    ) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        if (websocket?.readyState === WebSocket.OPEN) {
          startStatsStreaming();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    dockerAvailable,
    isConnected,
    isStatsStreaming,
    websocket,
    startStatsStreaming,
  ]);

  return {
    websocket,
    setWebsocket,
    sendMessage,
    startStatsStreaming,
    stopStatsStreaming,
  };
}
