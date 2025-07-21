import React, { useMemo } from "react";
import type { AppContextType } from "./types";
import { AppContext } from "./context";
import { useAppState } from "./useAppState";
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
    setContainers: state.setContainers,
    setImages: state.setImages,
    setNetworks: state.setNetworks,
    setVolumes: state.setVolumes,
    setImageHistory: state.setImageHistory,
    setIsConnected: state.setIsConnected,
    setDockerAvailable: state.setDockerAvailable,
    setDockerMessage: state.setDockerMessage,
    setLastUpdate: state.setLastUpdate,
    setLoading: state.setLoading,
    setImagesLoading: state.setImagesLoading,
    setNetworksLoading: state.setNetworksLoading,
    setVolumesLoading: state.setVolumesLoading,
    setError: state.setError,
    setIsStatsStreaming: state.setIsStatsStreaming,
    dockerAvailable: state.dockerAvailable,
    isConnected: state.isConnected,
    isStatsStreaming: state.isStatsStreaming,
  });

  // Docker actions
  const dockerActions = useDockerActions({
    sendMessage,
    setLoading: state.setLoading,
    setImagesLoading: state.setImagesLoading,
    setNetworksLoading: state.setNetworksLoading,
    setVolumesLoading: state.setVolumesLoading,
    setError: state.setError,
    setImageHistory: state.setImageHistory,
  });

  // Terminal management
  const terminalActions = useTerminalManagement({
    terminals: state.terminals,
    setTerminals: state.setTerminals,
    setActiveTerminalId: state.setActiveTerminalId,
    setShowTerminals: state.setShowTerminals,
    websocket,
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
