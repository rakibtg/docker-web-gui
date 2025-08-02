import React, { useMemo } from "react";
import { AppContext } from "./context";
import { useAppState } from "./useAppState";
import type { AppContextType } from "./types";
import { useWebSocket } from "./useWebSocket";
import { useDockerActions } from "./useDockerActions";
import { useTerminalManagement } from "./useTerminalManagement";

export type { AppContextType };

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Use custom hooks for state management
  const state = useAppState();

  // WebSocket management
  const {
    websocket,
    setWebsocket,
    sendMessage,
    startStatsStreaming,
    stopStatsStreaming,
  } = useWebSocket({
    setError: state.setError,
    setImages: state.setImages,
    setUserIP: state.setUserIP,
    setVolumes: state.setVolumes,
    setLoading: state.setLoading,
    isConnected: state.isConnected,
    setNetworks: state.setNetworks,
    setLastUpdate: state.setLastUpdate,
    setContainers: state.setContainers,
    setIsConnected: state.setIsConnected,
    setImageHistory: state.setImageHistory,
    dockerAvailable: state.dockerAvailable,
    setDockerMessage: state.setDockerMessage,
    isStatsStreaming: state.isStatsStreaming,
    setImagesLoading: state.setImagesLoading,
    setVolumesLoading: state.setVolumesLoading,
    setIPAccessDenied: state.setIPAccessDenied,
    setDockerAvailable: state.setDockerAvailable,
    setNetworksLoading: state.setNetworksLoading,
    setIsStatsStreaming: state.setIsStatsStreaming,
  });

  // Docker actions
  const dockerActions = useDockerActions({
    sendMessage,
    setError: state.setError,
    setLoading: state.setLoading,
    setImageHistory: state.setImageHistory,
    setImagesLoading: state.setImagesLoading,
    setVolumesLoading: state.setVolumesLoading,
    setNetworksLoading: state.setNetworksLoading,
  });

  // Terminal management
  const terminalActions = useTerminalManagement({
    websocket,
    terminals: state.terminals,
    setTerminals: state.setTerminals,
    setShowTerminals: state.setShowTerminals,
    setActiveTerminalId: state.setActiveTerminalId,
  });

  const value: AppContextType = useMemo(
    () => ({
      // State from useAppState
      ...state,

      // WebSocket
      websocket,
      setWebsocket,

      // Functions
      sendMessage,
      startStatsStreaming,
      stopStatsStreaming,
      ...dockerActions,
      ...terminalActions,
    }),
    [
      state,
      websocket,
      setWebsocket,
      sendMessage,
      startStatsStreaming,
      stopStatsStreaming,
      dockerActions,
      terminalActions,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
