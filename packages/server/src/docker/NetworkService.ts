import { BaseDockerService } from "./BaseDockerService";
import { DockerNetwork } from "./types";

export class NetworkService extends BaseDockerService {
  /**
   * Get all Docker networks with detailed information
   */
  static async getDockerNetworks(): Promise<DockerNetwork[]> {
    try {
      const { stdout } = await this.execDockerCommand(
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
            const { stdout: inspectOutput } = await this.execDockerCommand(
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
      throw error;
    }
  }

  /**
   * Remove a Docker network
   */
  static async removeDockerNetwork(networkId: string): Promise<void> {
    try {
      await this.execDockerCommand(`docker network rm ${networkId}`);
    } catch (error) {
      console.error(`Error removing Docker network ${networkId}:`, error);
      throw error;
    }
  }

  /**
   * Connect container to network
   */
  static async connectContainerToNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    try {
      await this.execDockerCommand(
        `docker network connect ${networkId} ${containerId}`
      );
    } catch (error) {
      console.error(
        `Error connecting container ${containerId} to network ${networkId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Disconnect container from network
   */
  static async disconnectContainerFromNetwork(
    containerId: string,
    networkId: string
  ): Promise<void> {
    try {
      const { stderr } = await this.execDockerCommand(
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
}
