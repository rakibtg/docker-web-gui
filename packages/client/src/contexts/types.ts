import type {
  ContainerWithStats,
  DockerImage,
  DockerNetwork,
  DockerVolume,
} from "../types";

export interface ImageHistoryLayer {
  id: string;
  created: string;
  createdBy: string;
  size: number;
  comment?: string;
}

export interface TerminalSession {
  id: string; // Unique terminal session ID
  containerId: string;
  containerName: string;
  isActive: boolean;
  type: "terminal" | "logs"; // Session type
}

export interface ImageHistoryState {
  imageId: string;
  imageName: string;
  layers: ImageHistoryLayer[];
  loading: boolean;
  isOpen: boolean;
}

export interface AppContextType {
  // Container state
  containers: ContainerWithStats[];
  setContainers: React.Dispatch<React.SetStateAction<ContainerWithStats[]>>;

  // Image state
  images: DockerImage[];
  setImages: React.Dispatch<React.SetStateAction<DockerImage[]>>;
  imagesLoading: boolean;
  setImagesLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Network state
  networks: DockerNetwork[];
  setNetworks: React.Dispatch<React.SetStateAction<DockerNetwork[]>>;
  networksLoading: boolean;
  setNetworksLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Volume state
  volumes: DockerVolume[];
  setVolumes: React.Dispatch<React.SetStateAction<DockerVolume[]>>;
  volumesLoading: boolean;
  setVolumesLoading: React.Dispatch<React.SetStateAction<boolean>>;

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
  requestNetworks: () => void;
  requestVolumes: () => void;
  requestVolumeDetails: (volumeName: string) => void;
  handleImageRemove: (imageId: string, force?: boolean) => void;
  handleNetworkRemove: (networkId: string, networkName?: string) => void;
  handleVolumeRemove: (volumeName: string) => void;
  handleVolumesPrune: () => void;
  handleContainerNetworkConnect: (
    networkId: string,
    containerId: string,
    networkName?: string,
    containerName?: string
  ) => void;
  handleContainerNetworkDisconnect: (
    networkId: string,
    containerId: string,
    networkName?: string,
    containerName?: string
  ) => void;
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
  closeAllTerminals: () => void;
}
