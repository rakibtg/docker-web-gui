import { BaseDockerService } from "./BaseDockerService";
import { DockerContainer, DockerOperationResult } from "./types";

export class ContainerService extends BaseDockerService {
  /**
   * Get all Docker containers (running and stopped)
   */
  static async getDockerContainers(): Promise<DockerContainer[]> {
    try {
      const { stdout } = await this.execDockerCommand(
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
      throw error;
    }
  }

  /**
   * Start a Docker container
   */
  static async startContainer(
    containerId: string
  ): Promise<DockerOperationResult> {
    try {
      const { stdout } = await this.execDockerCommand(
        `docker start ${containerId}`
      );
      console.log(`Container ${containerId} started:`, stdout);

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

  /**
   * Stop a Docker container
   */
  static async stopContainer(
    containerId: string
  ): Promise<DockerOperationResult> {
    try {
      const { stdout } = await this.execDockerCommand(
        `docker stop ${containerId}`
      );
      console.log(`Container ${containerId} stopped:`, stdout);

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

  /**
   * Restart a Docker container
   */
  static async restartContainer(
    containerId: string
  ): Promise<DockerOperationResult> {
    try {
      const { stdout } = await this.execDockerCommand(
        `docker restart ${containerId}`
      );
      console.log(`Container ${containerId} restarted:`, stdout);

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
}
