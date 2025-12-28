import { BaseDockerService } from "./BaseDockerService";
import { DockerNetwork, DockerOperationResult } from "./types";

export class NetworkService extends BaseDockerService {
  /**
   * Get all Docker networks with detailed information
   */
  static async getDockerNetworks(): Promise<DockerNetwork[]> {
    try {
      const { stdout } = await this.execDockerCommand(
        ["network", "ls", "--format", "{{json .}}"]
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
              ["network", "inspect", network.ID]
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
      const normalizedId = this.validateName(networkId, "network ID");
      await this.execDockerCommand(["network", "rm", normalizedId]);
    } catch (error) {
      console.error(`Error removing Docker network ${networkId}:`, error);
      throw error;
    }
  }

  /**
   * Prune unused Docker networks
   */
  static async pruneDockerNetworks(): Promise<DockerOperationResult> {
    try {
      const { stdout, stderr } = await this.execDockerCommand(
        ["network", "prune", "-f"]
      );

      if (stderr && !stderr.includes("WARNING")) {
        console.error("Docker network prune stderr:", stderr);
      }

      const lines = stdout.split("\n").map((line) => line.trim());
      const deletedNetworks: string[] = [];
      let reclaimedSpace = "0B";
      let collecting = false;

      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith("Deleted Networks:")) {
          collecting = true;
          continue;
        }
        if (line.startsWith("Total reclaimed space")) {
          reclaimedSpace = line.split("Total reclaimed space:")[1]?.trim() || "0B";
          collecting = false;
          continue;
        }
        if (collecting) {
          deletedNetworks.push(line);
        }
      }

      return {
        success: true,
        data: { deletedNetworks, reclaimedSpace },
        message: `Pruned ${deletedNetworks.length} networks, reclaimed ${reclaimedSpace}`,
      };
    } catch (error: any) {
      console.error("Error pruning networks:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to prune networks",
      };
    }
  }
}
