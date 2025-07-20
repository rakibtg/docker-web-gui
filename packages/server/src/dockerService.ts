import { exec, spawn } from "child_process";
import { promisify } from "util";
import { EventEmitter } from "events";

const execAsync = promisify(exec);

// Docker interface definitions
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  imageId: string;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  created: string;
  ipam: {
    driver: string;
    config: Array<{
      subnet?: string;
      gateway?: string;
    }>;
  };
  containers: Array<{
    name: string;
    id: string;
    ipv4Address?: string;
    ipv6Address?: string;
  }>;
  options: Record<string, string>;
  labels: Record<string, string>;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  configFrom?: {
    network: string;
  };
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  labels: Record<string, string>;
  options: Record<string, string>;
  scope: string;
  size?: string;
  usedBy?: Array<{
    containerId: string;
    containerName: string;
    mountPath: string;
  }>;
}

export interface DockerStats {
  id: string;
  name: string;
  cpuPerc: string;
  memUsage: string;
  memPerc: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

export interface ContainerWithStats extends DockerContainer {
  stats?: DockerStats;
}

export class DockerService extends EventEmitter {
  private statsProcess: any = null;
  private isStreaming = false;

  // Function to get Docker containers
  async getDockerContainers(): Promise<DockerContainer[]> {
    try {
      // Use docker ps -a to get all containers (running and stopped)
      const { stdout } = await execAsync(
        'docker ps -a --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}|{{.CreatedAt}}"'
      );

      const containers: DockerContainer[] = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [id, name, image, status, state, ports, created] =
            line.split("|");
          return {
            id: id || "",
            name: name || "",
            image: image || "",
            status: status || "",
            state: state || "",
            ports: ports || "",
            created: created || "",
          };
        });

      return containers;
    } catch (error) {
      console.error("Error getting Docker containers:", error);

      // Check if it's a permission error
      if (
        error instanceof Error &&
        error.message.includes("permission denied")
      ) {
        throw new Error(
          "Docker permission denied. Please ensure the current user is in the docker group. Run: sudo usermod -aG docker $USER && newgrp docker"
        );
      }

      // Check if Docker is not running
      if (
        error instanceof Error &&
        error.message.includes("Cannot connect to the Docker daemon")
      ) {
        throw new Error(
          "Docker daemon is not running. Please start Docker service."
        );
      }

      throw new Error(
        `Failed to get Docker containers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Parse docker stats output
  private parseStatsLine(line: string): DockerStats | null {
    try {
      const parts = line.split(/\s+/);
      if (parts.length < 8) return null;

      return {
        id: parts[0],
        name: parts[1],
        cpuPerc: parts[2],
        memUsage: parts[3] + " / " + parts[5],
        memPerc: parts[6],
        netIO: parts[7] + " / " + parts[9],
        blockIO: parts[10] + " / " + parts[12],
        pids: parts[13] || "0",
      };
    } catch (error) {
      console.error("Error parsing stats line:", line, error);
      return null;
    }
  }

  // Start streaming container stats
  startStatsStreaming(): void {
    if (this.isStreaming) {
      console.log("Stats streaming already active");
      return;
    }

    this.isStreaming = true;
    console.log("Starting Docker stats streaming...");

    // Use docker stats --no-stream first to get headers, then stream
    this.statsProcess = spawn("docker", [
      "stats",
      "--format",
      "table {{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}\t{{.PIDs}}",
    ]);

    let isFirstOutput = true;

    this.statsProcess.stdout.on("data", async (data: Buffer) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim());

      for (const line of lines) {
        // Skip header line
        if (isFirstOutput && line.includes("CONTAINER")) {
          isFirstOutput = false;
          continue;
        }

        if (line.trim()) {
          const stats = this.parseStatsLine(line);
          if (stats) {
            // Get container details and combine with stats
            try {
              const containers = await this.getDockerContainers();
              const container = containers.find(
                (c) => c.id.startsWith(stats.id) || c.name === stats.name
              );

              if (container) {
                const containerWithStats: ContainerWithStats = {
                  ...container,
                  stats,
                };

                this.emit("stats", containerWithStats);
              }
            } catch (error) {
              console.error(
                "Error getting container details for stats:",
                error
              );
            }
          }
        }
      }
    });

    this.statsProcess.stderr.on("data", (data: Buffer) => {
      console.error("Docker stats error:", data.toString());
      this.emit("error", new Error(data.toString()));
    });

    this.statsProcess.on("close", (code: number) => {
      console.log(`Docker stats process closed with code ${code}`);
      this.isStreaming = false;
      this.emit("close", code);
    });

    this.statsProcess.on("error", (error: Error) => {
      console.error("Docker stats process error:", error);
      this.isStreaming = false;
      this.emit("error", error);
    });
  }

  // Stop streaming container stats
  stopStatsStreaming(): void {
    if (this.statsProcess && this.isStreaming) {
      console.log("Stopping Docker stats streaming...");
      this.statsProcess.kill("SIGTERM");
      this.statsProcess = null;
      this.isStreaming = false;
    }
  }

  // Get current streaming status
  isStatsStreaming(): boolean {
    return this.isStreaming;
  }

  // Function to check if Docker is available
  async checkDockerAvailability(): Promise<{
    available: boolean;
    message?: string;
  }> {
    try {
      await execAsync("docker --version");

      // Test if we can actually run docker commands
      try {
        await execAsync("docker info");
        return { available: true };
      } catch (infoError) {
        if (
          infoError instanceof Error &&
          infoError.message.includes("permission denied")
        ) {
          return {
            available: false,
            message:
              "Docker is installed but permission denied. Please add user to docker group.",
          };
        }
        if (
          infoError instanceof Error &&
          infoError.message.includes("Cannot connect to the Docker daemon")
        ) {
          return {
            available: false,
            message: "Docker daemon is not running.",
          };
        }
        return {
          available: false,
          message: "Docker is installed but not accessible.",
        };
      }
    } catch (error) {
      console.error("Docker is not available:", error);
      return {
        available: false,
        message: "Docker is not installed or not in PATH.",
      };
    }
  }

  // Function to get Docker images
  async getDockerImages(): Promise<DockerImage[]> {
    try {
      const { stdout } = await execAsync(
        'docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}"'
      );

      const images: DockerImage[] = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [id, repository, tag, size, created] = line.split("|");
          return {
            id: `${repository}:${tag}`,
            repository: repository || "",
            tag: tag || "",
            size: size || "",
            created: created || "",
            imageId: id || "",
          };
        });

      return images;
    } catch (error) {
      console.error("Error getting Docker images:", error);
      throw new Error(
        `Failed to get Docker images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Remove a Docker image
  async removeImage(
    imageId: string,
    force: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    try {
      const command = force
        ? `docker rmi -f ${imageId}`
        : `docker rmi ${imageId}`;
      const { stdout, stderr } = await execAsync(command);
      console.log(`Image ${imageId} removed:`, stdout);

      return {
        success: true,
        message: `Image ${imageId} removed successfully`,
      };
    } catch (error) {
      console.error(`Error removing image ${imageId}:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to remove image",
      };
    }
  }

  // Get image history
  async getImageHistory(
    imageId: string
  ): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      const { stdout } = await execAsync(
        `docker history ${imageId} --format "table {{.ID}}\\t{{.CreatedBy}}\\t{{.Size}}\\t{{.CreatedSince}}" --no-trunc`
      );

      const lines = stdout.trim().split("\n");
      const headers = lines[0];
      const data = lines.slice(1).map((line) => {
        const [id, createdBy, size, createdSince] = line.split("\t");
        return { id, createdBy, size, createdSince };
      });

      return {
        success: true,
        data,
        message: `Image history for ${imageId} retrieved successfully`,
      };
    } catch (error) {
      console.error(`Error getting image history for ${imageId}:`, error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get image history",
      };
    }
  }

  // Start a Docker container
  async startContainer(
    containerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`docker start ${containerId}`);
      console.log(`Container ${containerId} started:`, stdout);

      // Emit container state change for real-time updates
      this.emit("container-state-changed", { containerId, action: "start" });

      return {
        success: true,
        message: `Container ${containerId} started successfully`,
      };
    } catch (error) {
      console.error(`Error starting container ${containerId}:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to start container",
      };
    }
  }

  // Stop a Docker container
  async stopContainer(
    containerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`docker stop ${containerId}`);
      console.log(`Container ${containerId} stopped:`, stdout);

      // Emit container state change for real-time updates
      this.emit("container-state-changed", { containerId, action: "stop" });

      return {
        success: true,
        message: `Container ${containerId} stopped successfully`,
      };
    } catch (error) {
      console.error(`Error stopping container ${containerId}:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to stop container",
      };
    }
  }

  // Restart a Docker container
  async restartContainer(
    containerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(
        `docker restart ${containerId}`
      );
      console.log(`Container ${containerId} restarted:`, stdout);

      // Emit container state change for real-time updates
      this.emit("container-state-changed", { containerId, action: "restart" });

      return {
        success: true,
        message: `Container ${containerId} restarted successfully`,
      };
    } catch (error) {
      console.error(`Error restarting container ${containerId}:`, error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to restart container",
      };
    }
  }

  // Create terminal session for container
  async createTerminalSession(containerId: string): Promise<any> {
    try {
      // Import node-pty
      const pty = require("node-pty");

      // First, detect which shell is available in the container
      let availableShell = "/bin/sh"; // Default fallback

      try {
        // Check for available shells in order of preference
        const shells = ["/bin/bash", "/bin/sh", "/bin/ash", "/bin/zsh"];

        for (const shell of shells) {
          try {
            await execAsync(`docker exec ${containerId} test -f ${shell}`);
            availableShell = shell;
            console.log(`Found shell ${shell} in container ${containerId}`);
            break;
          } catch (error) {
            // Shell not found, try next one
            continue;
          }
        }
      } catch (error) {
        console.log(
          `Could not detect shell for container ${containerId}, using /bin/sh`
        );
      }

      // Create terminal with the detected shell
      const terminal = pty.spawn(
        "docker",
        ["exec", "-it", containerId, availableShell],
        {
          name: "xterm-color",
          cols: 80,
          rows: 24,
          cwd: process.env.HOME || "/tmp",
          env: {
            ...process.env,
            TERM: "xterm-256color",
            COLORTERM: "truecolor",
          },
        }
      );

      return terminal;
    } catch (error) {
      console.error(
        `Error creating terminal session for container ${containerId}:`,
        error
      );
      throw new Error(
        `Failed to create terminal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Create logs session for container
  async createLogsSession(containerId: string): Promise<any> {
    try {
      // Create a logs process using docker logs with follow flag
      // Added --timestamps for better readability and limited tail to recent logs
      const logsProcess = spawn(
        "docker",
        ["logs", "-f", "--tail", "50", "--timestamps", containerId],
        {
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            // Ensure proper encoding
            LANG: "en_US.UTF-8",
            LC_ALL: "en_US.UTF-8",
          },
        }
      );

      const logsEmitter: any = new EventEmitter();

      let stdoutBuffer = "";
      let stderrBuffer = "";

      logsProcess.stdout.on("data", (data: Buffer) => {
        stdoutBuffer += data.toString("utf8");
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            logsEmitter.emit("data", line + "\r\n");
          }
        }
      });

      logsProcess.stderr.on("data", (data: Buffer) => {
        stderrBuffer += data.toString("utf8");
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            logsEmitter.emit("data", "\x1b[91m" + line + "\x1b[0m\r\n");
          }
        }
      });

      logsProcess.on("exit", (code: number, signal: string) => {
        if (stdoutBuffer.trim()) {
          logsEmitter.emit("data", stdoutBuffer + "\r\n");
        }
        if (stderrBuffer.trim()) {
          logsEmitter.emit("data", "\x1b[91m" + stderrBuffer + "\x1b[0m\r\n");
        }
        logsEmitter.emit("exit", code, signal);
      });

      logsProcess.on("error", (error: Error) => {
        logsEmitter.emit("error", error);
      });

      logsEmitter.kill = () => {
        logsProcess.kill("SIGTERM");
      };

      logsEmitter.resize = () => {
        // SKip (no-op for logs)
      };

      return logsEmitter;
    } catch (error) {
      console.error(
        `Error creating logs session for container ${containerId}:`,
        error
      );
      throw new Error(
        `Failed to create logs session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Function to get Docker networks
  async getDockerNetworks(): Promise<any[]> {
    try {
      const { stdout } = await execAsync(
        'docker network ls --format "{{json .}}"'
      );

      const networks = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line));

      // Get detailed information for each network
      const detailedNetworks = await Promise.all(
        networks.map(async (network) => {
          try {
            const { stdout: inspectOutput } = await execAsync(
              `docker network inspect ${network.ID}`
            );
            const [inspectData] = JSON.parse(inspectOutput);

            return {
              id: inspectData.Id,
              name: inspectData.Name,
              driver: inspectData.Driver,
              scope: inspectData.Scope,
              created: inspectData.Created,
              ipam: inspectData.IPAM || { driver: "", config: [] },
              containers: Object.entries(inspectData.Containers || {}).map(
                ([id, info]: [string, any]) => ({
                  id,
                  name: info.Name,
                  ipv4Address: info.IPv4Address,
                  ipv6Address: info.IPv6Address,
                })
              ),
              options: inspectData.Options || {},
              labels: inspectData.Labels || {},
              internal: inspectData.Internal || false,
              attachable: inspectData.Attachable || false,
              ingress: inspectData.Ingress || false,
              configFrom: inspectData.ConfigFrom,
            };
          } catch (error) {
            console.error(`Error inspecting network ${network.ID}:`, error);
            return {
              id: network.ID,
              name: network.Name,
              driver: network.Driver,
              scope: network.Scope,
              created: network.CreatedAt || "",
              ipam: { driver: "", config: [] },
              containers: [],
              options: {},
              labels: {},
              internal: false,
              attachable: false,
              ingress: false,
            };
          }
        })
      );

      return detailedNetworks;
    } catch (error) {
      console.error("Error getting Docker networks:", error);

      if (
        error instanceof Error &&
        error.message.includes("permission denied")
      ) {
        throw new Error(
          "Docker permission denied. Please ensure the current user is in the docker group."
        );
      }

      if (
        error instanceof Error &&
        error.message.includes("Cannot connect to the Docker daemon")
      ) {
        throw new Error(
          "Docker daemon is not running. Please start Docker service."
        );
      }

      throw new Error(
        `Failed to get Docker networks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Function to remove a Docker network
  async removeDockerNetwork(networkId: string): Promise<void> {
    try {
      await execAsync(`docker network rm ${networkId}`);
    } catch (error) {
      console.error(`Error removing Docker network ${networkId}:`, error);
      throw new Error(
        `Failed to remove network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Function to connect container to network
  async connectContainerToNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    try {
      await execAsync(`docker network connect ${networkId} ${containerId}`);
    } catch (error) {
      console.error(
        `Error connecting container ${containerId} to network ${networkId}:`,
        error
      );
      throw new Error(
        `Failed to connect container to network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Function to disconnect container from network
  async disconnectContainerFromNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    try {
      const { stderr } = await execAsync(
        `docker network disconnect ${networkId} ${containerId}`
      );

      if (stderr) {
        console.error("Docker network disconnect stderr:", stderr);
        throw new Error(stderr);
      }

      console.log(
        `Container ${containerId} disconnected from network ${networkId}`
      );
    } catch (error: any) {
      console.error("Error disconnecting container from network:", error);
      throw new Error(
        `Failed to disconnect container from network: ${error.message}`
      );
    }
  }

  // Function to get Docker volumes
  async getDockerVolumes(): Promise<any[]> {
    try {
      // Get volume list with basic info
      const { stdout: volumeList } = await execAsync(
        'docker volume ls --format "{{.Name}}|{{.Driver}}|{{.Scope}}"'
      );

      if (!volumeList.trim()) {
        return [];
      }

      const volumes = [];
      const volumeLines = volumeList.trim().split("\n");

      for (const line of volumeLines) {
        const [name, driver, scope] = line.split("|");

        try {
          // Get detailed volume info
          const { stdout: volumeInfo } = await execAsync(
            `docker volume inspect ${name}`
          );

          const volumeDetails = JSON.parse(volumeInfo)[0];

          // Get containers using this volume
          const { stdout: containerList } = await execAsync(
            `docker ps -a --format "{{.ID}}|{{.Names}}" --filter volume=${name}`
          );

          const usedBy = [];
          if (containerList.trim()) {
            const containerLines = containerList.trim().split("\n");
            for (const containerLine of containerLines) {
              const [containerId, containerName] = containerLine.split("|");

              // Get mount information for this container
              try {
                const { stdout: mountInfo } = await execAsync(
                  `docker inspect ${containerId} --format "{{json .Mounts}}"`
                );

                const mounts = JSON.parse(mountInfo);
                const volumeMounts = mounts.filter(
                  (mount: any) => mount.Name === name
                );

                for (const mount of volumeMounts) {
                  usedBy.push({
                    containerId,
                    containerName,
                    mountPath: mount.Destination || "",
                  });
                }
              } catch (err) {
                console.warn(
                  `Could not get mount info for container ${containerId}:`,
                  err
                );
              }
            }
          }

          // Get volume size (approximate)
          let size = "Unknown";
          try {
            const { stdout: sizeInfo } = await execAsync(
              `du -sh "${volumeDetails.Mountpoint}" 2>/dev/null || echo "Unknown"`
            );
            size = sizeInfo.trim().split("\t")[0] || "Unknown";
          } catch (err) {
            // Size calculation might fail due to permissions
          }

          volumes.push({
            name: volumeDetails.Name,
            driver: volumeDetails.Driver,
            mountpoint: volumeDetails.Mountpoint,
            created: volumeDetails.CreatedAt,
            labels: volumeDetails.Labels || {},
            options: volumeDetails.Options || {},
            scope: volumeDetails.Scope || scope,
            size,
            usedBy,
          });
        } catch (err) {
          console.warn(`Could not get details for volume ${name}:`, err);
          // Add basic volume info even if detailed inspection fails
          volumes.push({
            name,
            driver,
            mountpoint: "",
            created: "",
            labels: {},
            options: {},
            scope,
            size: "Unknown",
            usedBy: [],
          });
        }
      }

      return volumes;
    } catch (error: any) {
      console.error("Error getting Docker volumes:", error);
      throw new Error(`Failed to get Docker volumes: ${error.message}`);
    }
  }

  // Function to remove Docker volume
  async removeDockerVolume(volumeName: string): Promise<void> {
    try {
      const { stderr } = await execAsync(`docker volume rm ${volumeName}`);

      if (stderr) {
        console.error("Docker volume remove stderr:", stderr);
        throw new Error(stderr);
      }

      console.log(`Volume ${volumeName} removed successfully`);
    } catch (error: any) {
      console.error("Error removing Docker volume:", error);
      throw new Error(`Failed to remove volume: ${error.message}`);
    }
  }

  // Function to prune unused volumes
  async pruneDockerVolumes(): Promise<{
    deletedVolumes: string[];
    reclaimedSpace: string;
  }> {
    try {
      const { stdout, stderr } = await execAsync(`docker volume prune -f`);

      if (stderr && !stderr.includes("WARNING")) {
        console.error("Docker volume prune stderr:", stderr);
        throw new Error(stderr);
      }

      // Parse the output to extract deleted volumes and reclaimed space
      const lines = stdout.split("\n");
      const deletedVolumes: string[] = [];
      let reclaimedSpace = "0B";

      for (const line of lines) {
        if (line.includes("deleted:")) {
          const volumeName = line.split("deleted: ")[1]?.trim();
          if (volumeName) {
            deletedVolumes.push(volumeName);
          }
        }
        if (line.includes("Total reclaimed space:")) {
          reclaimedSpace =
            line.split("Total reclaimed space: ")[1]?.trim() || "0B";
        }
      }

      console.log(
        `Pruned ${deletedVolumes.length} volumes, reclaimed ${reclaimedSpace}`
      );
      return { deletedVolumes, reclaimedSpace };
    } catch (error: any) {
      console.error("Error pruning Docker volumes:", error);
      throw new Error(`Failed to prune volumes: ${error.message}`);
    }
  }

  // Function to get specific Docker volume details
  async getDockerVolumeDetails(volumeName: string): Promise<any> {
    try {
      // First check if volume exists
      const { stdout: volumeExists } = await execAsync(
        `docker volume ls --format "{{.Name}}" --filter name=${volumeName}`
      );

      if (!volumeExists.trim()) {
        throw new Error(`Volume "${volumeName}" not found`);
      }

      // Get detailed volume info
      const { stdout: volumeInfo } = await execAsync(
        `docker volume inspect ${volumeName}`
      );

      const volumeDetails = JSON.parse(volumeInfo)[0];

      // Get containers using this volume
      const { stdout: containerList } = await execAsync(
        `docker ps -a --format "{{.ID}}|{{.Names}}" --filter volume=${volumeName}`
      );

      const usedBy = [];
      if (containerList.trim()) {
        const containerLines = containerList.trim().split("\n");
        for (const containerLine of containerLines) {
          const [containerId, containerName] = containerLine.split("|");

          // Get mount information for this container
          try {
            const { stdout: mountInfo } = await execAsync(
              `docker inspect ${containerId} --format "{{json .Mounts}}"`
            );

            const mounts = JSON.parse(mountInfo);
            const volumeMounts = mounts.filter(
              (mount: any) => mount.Name === volumeName
            );

            for (const mount of volumeMounts) {
              usedBy.push({
                containerId,
                containerName,
                mountPath: mount.Destination || "",
              });
            }
          } catch (err) {
            console.warn(
              `Could not get mount info for container ${containerId}:`,
              err
            );
          }
        }
      }

      // Get volume size (approximate)
      let size = "Unknown";
      try {
        const { stdout: sizeInfo } = await execAsync(
          `du -sh "${volumeDetails.Mountpoint}" 2>/dev/null || echo "Unknown"`
        );
        size = sizeInfo.trim().split("\t")[0] || "Unknown";
      } catch (err) {
        // Size calculation might fail due to permissions
      }

      return {
        name: volumeDetails.Name,
        driver: volumeDetails.Driver,
        mountpoint: volumeDetails.Mountpoint,
        created: volumeDetails.CreatedAt,
        labels: volumeDetails.Labels || {},
        options: volumeDetails.Options || {},
        scope: volumeDetails.Scope,
        size,
        usedBy,
      };
    } catch (error: any) {
      console.error(
        `Error getting Docker volume details for ${volumeName}:`,
        error
      );
      throw new Error(`Failed to get volume details: ${error.message}`);
    }
  }
}
