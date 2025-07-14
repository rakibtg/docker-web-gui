import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import type { ContainerWithStats, DockerImage } from "../types";
import type { ImageHistoryLayer } from "../components/ImageHistoryModal";

interface TerminalSession {
  id: string; // Unique terminal session ID
  containerId: string;
  containerName: string;
  isActive: boolean;
  type: "terminal" | "logs"; // Session type
}

interface ImageHistoryState {
  imageId: string;
  imageName: string;
  layers: ImageHistoryLayer[];
  loading: boolean;
  isOpen: boolean;
}

interface AppContextType {
  // Container state
  containers: ContainerWithStats[];
  setContainers: React.Dispatch<React.SetStateAction<ContainerWithStats[]>>;

  // Image state
  images: DockerImage[];
  setImages: React.Dispatch<React.SetStateAction<DockerImage[]>>;
  imagesLoading: boolean;
  setImagesLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Image history state
  imageHistory: ImageHistoryState;
  setImageHistory: React.Dispatch<React.SetStateAction<ImageHistoryState>>;

  // Connection state
  isConnected: boolean;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  dockerAvailable: boolean | null;
  setDockerAvailable: React.Dispatch<React.SetStateAction<boolean | null>>;
  dockerMessage: string;
  setDockerMessage: React.Dispatch<React.SetStateAction<string>>;

  // UI state
  lastUpdate: string;
  setLastUpdate: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isStatsStreaming: boolean;
  setIsStatsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  showTerminals: boolean;
  setShowTerminals: React.Dispatch<React.SetStateAction<boolean>>;

  // Terminal state
  terminals: TerminalSession[];
  setTerminals: React.Dispatch<React.SetStateAction<TerminalSession[]>>;
  activeTerminalId: string | null;
  setActiveTerminalId: React.Dispatch<React.SetStateAction<string | null>>;

  // WebSocket
  websocket: WebSocket | null;
  setWebsocket: React.Dispatch<React.SetStateAction<WebSocket | null>>;

  // Functions
  sendMessage: (message: object) => boolean;
  requestContainers: () => void;
  requestImages: () => void;
  handleImageRemove: (imageId: string, force?: boolean) => void;
  getImageHistory: (imageId: string, imageName: string) => void;
  closeImageHistory: () => void;
  startStatsStreaming: () => void;
  stopStatsStreaming: () => void;
  handleContainerToggle: (containerId: string, currentState: string) => void;
  handleContainerRestart: (containerId: string) => void;
  addTerminal: (containerId: string, containerName: string) => void;
  addLogs: (containerId: string, containerName: string) => void;
  removeTerminal: (terminalId: string) => void;
  closeTerminal: (terminalId: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export type { AppContextType };

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Container state
  const [containers, setContainers] = useState<ContainerWithStats[]>([]);

  // Image state
  const [images, setImages] = useState<DockerImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Image history state
  const [imageHistory, setImageHistory] = useState<ImageHistoryState>({
    imageId: "",
    imageName: "",
    layers: [],
    loading: false,
    isOpen: false,
  });

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [dockerAvailable, setDockerAvailable] = useState<boolean | null>(null);
  const [dockerMessage, setDockerMessage] = useState<string>("");

  // UI state
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isStatsStreaming, setIsStatsStreaming] = useState(false);
  const [showTerminals, setShowTerminals] = useState(false);

  // Terminal state
  const [terminals, setTerminals] = useState<TerminalSession[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  // WebSocket state
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

  // Function to request containers list
  const requestContainers = useCallback(() => {
    setLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-containers" });
    if (!sent) {
      setLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage]);

  // Function to request images list
  const requestImages = useCallback(() => {
    setImagesLoading(true);
    setError("");
    const sent = sendMessage({ type: "get-images" });
    if (!sent) {
      setImagesLoading(false);
      setError("Cannot send request - not connected to server");
    }
  }, [sendMessage]);

  // Function to remove an image
  const handleImageRemove = useCallback(
    (imageId: string, force: boolean = false) => {
      sendMessage({
        type: "remove-image",
        imageId: imageId,
        force: force,
      });
    },
    [sendMessage]
  );

  // Function to get image history
  const getImageHistory = useCallback(
    (imageId: string, imageName: string) => {
      setImageHistory((prev) => ({
        ...prev,
        imageId,
        imageName,
        loading: true,
        isOpen: true,
        layers: [],
      }));

      sendMessage({
        type: "get-image-history",
        imageId: imageId,
      });
    },
    [sendMessage]
  );

  // Function to close image history modal
  const closeImageHistory = useCallback(() => {
    setImageHistory((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

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

  // Function to toggle container state
  const handleContainerToggle = useCallback(
    (containerId: string, currentState: string) => {
      const action =
        currentState === "running" ? "stop-container" : "start-container";
      console.log(
        `${action === "stop-container" ? "Stopping" : "Starting"} container:`,
        containerId
      );

      sendMessage({
        type: action,
        containerId: containerId,
      });
    },
    [sendMessage]
  );

  const handleContainerRestart = useCallback(
    (containerId: string) => {
      sendMessage({
        type: "restart-container",
        containerId: containerId,
      });
    },
    [sendMessage]
  );

  // Terminal management functions
  const addTerminal = useCallback(
    (containerId: string, containerName: string) => {
      const id = `terminal-${containerId}-${Date.now()}`;
      const newTerminal: TerminalSession = {
        id,
        containerId,
        containerName,
        isActive: true,
        type: "terminal",
      };

      setTerminals((prev) => [...prev, newTerminal]);
      setActiveTerminalId(id);
      setShowTerminals(true);
    },
    []
  );

  const addLogs = useCallback((containerId: string, containerName: string) => {
    const id = `logs-${containerId}-${Date.now()}`;
    const newLogsSession: TerminalSession = {
      id,
      containerId,
      containerName,
      isActive: true,
      type: "logs",
    };

    setTerminals((prev) => [...prev, newLogsSession]);
    setActiveTerminalId(id);
    setShowTerminals(true);
  }, []);

  const removeTerminal = useCallback(
    (terminalId: string) => {
      setTerminals((prev) => prev.filter((t) => t.id !== terminalId));

      // Update active terminal if needed
      setActiveTerminalId((currentActive) => {
        if (currentActive === terminalId) {
          const filtered = terminals.filter((t) => t.id !== terminalId);
          const lastTerminal = filtered[filtered.length - 1];
          return lastTerminal ? lastTerminal.id : null;
        }
        return currentActive;
      });
    },
    [terminals]
  );

  const closeTerminal = useCallback(
    (terminalId: string) => {
      const terminal = terminals.find((t) => t.id === terminalId);
      if (terminal && websocket?.readyState === WebSocket.OPEN) {
        const disconnectType =
          terminal.type === "logs" ? "logs-disconnect" : "terminal-disconnect";
        websocket.send(
          JSON.stringify({
            type: disconnectType,
            terminalId: terminal.id, // Use terminalId instead of containerId
            containerId: terminal.containerId,
          })
        );
      }

      removeTerminal(terminalId);

      // Check if this was the last terminal
      const remainingTerminals = terminals.filter((t) => t.id !== terminalId);
      if (remainingTerminals.length === 0) {
        setShowTerminals(false);
        setActiveTerminalId(null);
      }
    },
    [terminals, websocket, removeTerminal]
  );

  // WebSocket connection management
  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      // Don't reconnect if component is unmounting
      if (!shouldReconnectRef.current) {
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
                  return; // Skip this update
                }

                lastStatsUpdateRef.current[containerId] = now;

                setContainers((prevContainers) => {
                  // Only update if stats actually changed to prevent unnecessary re-renders
                  const existingContainer = prevContainers.find(
                    (container) =>
                      container.id === containerWithStats.id ||
                      container.name === containerWithStats.name
                  );

                  if (
                    existingContainer &&
                    JSON.stringify(existingContainer.stats) ===
                      JSON.stringify(containerWithStats.stats)
                  ) {
                    return prevContainers; // No change, return same reference
                  }

                  return prevContainers.map((container) =>
                    container.id === containerWithStats.id ||
                    container.name === containerWithStats.name
                      ? { ...container, stats: containerWithStats.stats }
                      : container
                  );
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
                const actionPastTense =
                  action === "start"
                    ? "started"
                    : action === "stop"
                    ? "stopped"
                    : "restarted";
                console.log(
                  `Container ${containerId} ${actionPastTense} successfully`
                );
                // Container list will be refreshed automatically by the server
              } else {
                setError(actionMessage || `Failed to ${action} container`);
                console.error(
                  `Failed to ${action} container ${containerId}:`,
                  actionMessage
                );
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
                const actionPastTense =
                  action === "pull"
                    ? "pulled"
                    : action === "remove"
                    ? "removed"
                    : "pruned";
                console.log(
                  `Image ${
                    imageId || imageName || "operation"
                  } ${actionPastTense} successfully`
                );
                // Image list will be refreshed automatically by the server
              } else {
                setError(actionMessage || `Failed to ${action} image`);
                console.error(
                  `Failed to ${action} image ${imageId || imageName}:`,
                  actionMessage
                );
              }
              break;
            }

            case "image-history-result": {
              const historyResult = message;
              console.log("Image history result:", historyResult);

              if (historyResult.success && historyResult.data) {
                setImageHistory((prev) => ({
                  ...prev,
                  layers: historyResult.data || [],
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
  }, [cleanup]);

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
  }, []); // Empty dependency array since we use refs

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

  const value: AppContextType = useMemo(
    () => ({
      // Container state
      containers,
      setContainers,

      // Image state
      images,
      setImages,
      imagesLoading,
      setImagesLoading,

      // Image history state
      imageHistory,
      setImageHistory,

      // Connection state
      isConnected,
      setIsConnected,
      dockerAvailable,
      setDockerAvailable,
      dockerMessage,
      setDockerMessage,

      // UI state
      lastUpdate,
      setLastUpdate,
      loading,
      setLoading,
      error,
      setError,
      isStatsStreaming,
      setIsStatsStreaming,
      showTerminals,
      setShowTerminals,

      // Terminal state
      terminals,
      setTerminals,
      activeTerminalId,
      setActiveTerminalId,

      // WebSocket
      websocket,
      setWebsocket,

      // Functions
      sendMessage,
      requestContainers,
      requestImages,
      handleImageRemove,
      getImageHistory,
      closeImageHistory,
      startStatsStreaming,
      stopStatsStreaming,
      handleContainerToggle,
      handleContainerRestart,
      addTerminal,
      addLogs,
      removeTerminal,
      closeTerminal,
    }),
    [
      containers,
      images,
      imageHistory,
      isConnected,
      dockerAvailable,
      dockerMessage,
      lastUpdate,
      loading,
      imagesLoading,
      error,
      isStatsStreaming,
      showTerminals,
      terminals,
      activeTerminalId,
      websocket,
      sendMessage,
      requestContainers,
      requestImages,
      handleImageRemove,
      getImageHistory,
      closeImageHistory,
      startStatsStreaming,
      stopStatsStreaming,
      handleContainerToggle,
      handleContainerRestart,
      addTerminal,
      addLogs,
      removeTerminal,
      closeTerminal,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
