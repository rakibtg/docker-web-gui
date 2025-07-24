import { BaseDockerService } from "./BaseDockerService";
import {
  DockerContainer,
  DockerContainerDetails,
  DockerOperationResult,
} from "./types";

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

  /**
   * Get detailed information about a specific Docker container
   */
  static async getDockerContainerDetails(
    containerId: string
  ): Promise<DockerContainerDetails> {
    try {
      console.log(`Getting container details for: ${containerId}`);

      // First check if container exists
      const { stdout: containerExists } = await this.execDockerCommand(
        `docker ps -a --format "{{.ID}}" --filter id=${containerId}`
      );

      if (!containerExists.trim()) {
        throw new Error(`Container "${containerId}" not found`);
      }

      console.log(`Container ${containerId} found, getting detailed info...`);

      // Get detailed container info using docker inspect
      const { stdout: containerInfo } = await this.execDockerCommand(
        `docker inspect ${containerId}`
      );

      const containerDetails = JSON.parse(containerInfo)[0];
      console.log(`Container details parsed for: ${containerId}`);

      // Extract basic container info first
      const basicInfo = await this.getDockerContainers();
      const basicContainer = basicInfo.find((c) =>
        c.id.startsWith(containerId)
      ) || {
        id: containerDetails.Id || containerId,
        name: (containerDetails.Name || "").replace(/^\//, ""),
        image: containerDetails.Config?.Image || "",
        status: containerDetails.State?.Status || "",
        state: containerDetails.State?.Status || "",
        ports: "",
        created: containerDetails.Created || "",
      };

      console.log(`Basic container info extracted for: ${containerId}`);

      // Process port bindings
      let ports = "";
      if (containerDetails.NetworkSettings?.Ports) {
        const portMappings = [];
        for (const [containerPort, hostBindings] of Object.entries(
          containerDetails.NetworkSettings.Ports
        )) {
          if (hostBindings && Array.isArray(hostBindings)) {
            for (const binding of hostBindings) {
              if (
                binding &&
                typeof binding === "object" &&
                "HostPort" in binding
              ) {
                portMappings.push(
                  `${binding.HostIp || "0.0.0.0"}:${
                    binding.HostPort
                  }->${containerPort}`
                );
              }
            }
          } else if (containerPort) {
            portMappings.push(containerPort);
          }
        }
        ports = portMappings.join(", ");
      }

      // Extract detailed information
      const detailedContainer: DockerContainerDetails = {
        ...basicContainer,
        ports,
        command:
          containerDetails.Config?.Cmd?.join(" ") ||
          containerDetails.Path ||
          "",
        labels: containerDetails.Config?.Labels || {},
        env: containerDetails.Config?.Env || [],
        mounts: (containerDetails.Mounts || []).map((mount: any) => ({
          type: mount.Type || "",
          source: mount.Source || "",
          destination: mount.Destination || "",
          mode: mount.Mode || "",
          name: mount.Name || undefined,
        })),
        networks: Object.entries(
          containerDetails.NetworkSettings?.Networks || {}
        ).map(([name, network]: [string, any]) => ({
          name,
          networkId: network.NetworkID || "",
          ipAddress: network.IPAddress || network.GlobalIPv6Address || "",
          gateway: network.Gateway || network.IPv6Gateway || "",
          macAddress: network.MacAddress || "",
        })),
        restartPolicy: {
          name: containerDetails.HostConfig?.RestartPolicy?.Name || "no",
          maximumRetryCount:
            containerDetails.HostConfig?.RestartPolicy?.MaximumRetryCount ||
            undefined,
        },
        privileged: containerDetails.HostConfig?.Privileged || false,
        workingDir: containerDetails.Config?.WorkingDir || "",
        user: containerDetails.Config?.User || "",
        hostname: containerDetails.Config?.Hostname || "",
        platform: containerDetails.Platform || "",
        architecture: containerDetails.Architecture || "",
      };

      console.log(`Container details successfully created for: ${containerId}`);
      return detailedContainer;
    } catch (error) {
      console.error("Error getting Docker container details:", error);
      throw error;
    }
  }
}
