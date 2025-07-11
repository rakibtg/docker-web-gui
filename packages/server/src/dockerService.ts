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
}
