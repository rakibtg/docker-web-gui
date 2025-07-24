import { EventEmitter } from "events";
import {
  BaseDockerService,
  ContainerService,
  ImageService,
  NetworkService,
  VolumeService,
  StatsService,
  TerminalService,
  // Re-export types for backward compatibility
  DockerContainer,
  DockerContainerDetails,
  DockerImage,
  DockerNetwork,
  DockerVolume,
  DockerStats,
  ContainerWithStats,
  DockerOperationResult,
  DockerAvailabilityResult,
  VolumesPruneResult,
} from "./docker";

// Re-export types for backward compatibility
export {
  DockerContainer,
  DockerContainerDetails,
  DockerImage,
  DockerNetwork,
  DockerVolume,
  DockerStats,
  ContainerWithStats,
};

/**
 * Refactored DockerService that orchestrates all Docker operations
 * while maintaining backward compatibility with existing code.
 */
export class DockerService extends EventEmitter {
  private statsService: StatsService;

  constructor() {
    super();
    this.statsService = new StatsService();

    // Forward stats service events
    this.statsService.on("stats", (data) => this.emit("stats", data));
    this.statsService.on("error", (error) => this.emit("error", error));
    this.statsService.on("close", (code) => this.emit("close", code));
  }

  // === Container Operations ===
  async getDockerContainers(): Promise<DockerContainer[]> {
    return ContainerService.getDockerContainers();
  }

  async startContainer(containerId: string): Promise<DockerOperationResult> {
    const result = await ContainerService.startContainer(containerId);
    if (result.success) {
      this.emit("container-state-changed", { containerId, action: "start" });
    }
    return result;
  }

  async stopContainer(containerId: string): Promise<DockerOperationResult> {
    const result = await ContainerService.stopContainer(containerId);
    if (result.success) {
      this.emit("container-state-changed", { containerId, action: "stop" });
    }
    return result;
  }

  async restartContainer(containerId: string): Promise<DockerOperationResult> {
    const result = await ContainerService.restartContainer(containerId);
    if (result.success) {
      this.emit("container-state-changed", { containerId, action: "restart" });
    }
    return result;
  }

  async getDockerContainerDetails(
    containerId: string
  ): Promise<DockerContainerDetails> {
    return ContainerService.getDockerContainerDetails(containerId);
  }

  // === Image Operations ===
  async getDockerImages(): Promise<DockerImage[]> {
    return ImageService.getDockerImages();
  }

  async removeImage(
    imageId: string,
    force: boolean = false
  ): Promise<DockerOperationResult> {
    return ImageService.removeImage(imageId, force);
  }

  async getImageHistory(imageId: string): Promise<DockerOperationResult> {
    return ImageService.getImageHistory(imageId);
  }

  // === Network Operations ===
  async getDockerNetworks(): Promise<DockerNetwork[]> {
    return NetworkService.getDockerNetworks();
  }

  async removeDockerNetwork(networkId: string): Promise<void> {
    return NetworkService.removeDockerNetwork(networkId);
  }

  async connectContainerToNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    return NetworkService.connectContainerToNetwork(containerId, networkId);
  }

  async disconnectContainerFromNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    return NetworkService.disconnectContainerFromNetwork(
      containerId,
      networkId
    );
  }

  // === Volume Operations ===
  async getDockerVolumes(): Promise<DockerVolume[]> {
    return VolumeService.getDockerVolumes();
  }

  async removeDockerVolume(volumeName: string): Promise<void> {
    return VolumeService.removeDockerVolume(volumeName);
  }

  async pruneDockerVolumes(): Promise<VolumesPruneResult> {
    return VolumeService.pruneDockerVolumes();
  }

  async getDockerVolumeDetails(volumeName: string): Promise<DockerVolume> {
    return VolumeService.getDockerVolumeDetails(volumeName);
  }

  // === Terminal and Logs Operations ===
  async createTerminalSession(containerId: string): Promise<any> {
    return TerminalService.createTerminalSession(containerId);
  }

  async createLogsSession(containerId: string): Promise<any> {
    return TerminalService.createLogsSession(containerId);
  }

  // === Stats Operations ===
  startStatsStreaming(): void {
    this.statsService.startStatsStreaming();
  }

  stopStatsStreaming(): void {
    this.statsService.stopStatsStreaming();
  }

  isStatsStreaming(): boolean {
    return this.statsService.isStatsStreaming();
  }

  // === Docker Availability Check ===
  async checkDockerAvailability(): Promise<DockerAvailabilityResult> {
    return BaseDockerService.checkDockerAvailability();
  }
}
