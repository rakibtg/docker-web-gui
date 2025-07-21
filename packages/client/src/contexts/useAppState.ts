import { useState } from "react";
import type {
  ContainerWithStats,
  DockerImage,
  DockerNetwork,
  DockerVolume,
} from "../types";
import type { ImageHistoryState, TerminalSession } from "./types";

export function useAppState() {
  // Container state
  const [containers, setContainers] = useState<ContainerWithStats[]>([]);

  // Image state
  const [images, setImages] = useState<DockerImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Network state
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [networksLoading, setNetworksLoading] = useState(false);

  // Volume state
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [volumesLoading, setVolumesLoading] = useState(false);

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

  return {
    // Container state
    containers,
    setContainers,

    // Image state
    images,
    setImages,
    imagesLoading,
    setImagesLoading,

    // Network state
    networks,
    setNetworks,
    networksLoading,
    setNetworksLoading,

    // Volume state
    volumes,
    setVolumes,
    volumesLoading,
    setVolumesLoading,

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
  };
}
