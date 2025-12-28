import { BaseDockerService } from "./BaseDockerService";
import { DockerVolume, VolumesPruneResult } from "./types";

export class VolumeService extends BaseDockerService {
  /**
   * Get all Docker volumes with detailed information
   */
  static async getDockerVolumes(): Promise<DockerVolume[]> {
    try {
      // Get volume list with basic info
      const { stdout: volumeList } = await this.execDockerCommand(
        ["volume", "ls", "--format", "{{.Name}}|{{.Driver}}|{{.Scope}}"]
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
          const { stdout: volumeInfo } = await this.execDockerCommand(
            ["volume", "inspect", name]
          );

          const volumeDetails = JSON.parse(volumeInfo)[0];

          // Get containers using this volume
          const { stdout: containerList } = await this.execDockerCommand(
            ["ps", "-a", "--format", "{{.ID}}|{{.Names}}", "--filter", `volume=${name}`]
          );

          const usedBy = [];
          if (containerList.trim()) {
            const containerLines = containerList.trim().split("\n");
            for (const containerLine of containerLines) {
              const [containerId, containerName] = containerLine.split("|");

              // Get mount information for this container
              try {
                const { stdout: mountInfo } = await this.execDockerCommand(
                  ["inspect", containerId, "--format", "{{json .Mounts}}"]
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
            const { stdout: sizeInfo } = await this.execCommand(
              "du",
              ["-sh", volumeDetails.Mountpoint],
              { logErrors: false }
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
      throw error;
    }
  }

  /**
   * Remove a Docker volume
   */
  static async removeDockerVolume(volumeName: string): Promise<void> {
    try {
      const normalizedName = this.validateName(volumeName, "volume name");
      const { stderr } = await this.execDockerCommand(
        ["volume", "rm", normalizedName]
      );

      if (stderr) {
        console.error("Docker volume remove stderr:", stderr);
        throw new Error(stderr);
      }

      console.log(`Volume ${normalizedName} removed successfully`);
    } catch (error: any) {
      console.error("Error removing Docker volume:", error);
      throw new Error(`Failed to remove volume: ${error.message}`);
    }
  }

  /**
   * Prune unused volumes
   */
  static async pruneDockerVolumes(): Promise<VolumesPruneResult> {
    try {
      const { stdout, stderr } = await this.execDockerCommand(
        ["volume", "prune", "-f"]
      );

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

  /**
   * Get specific Docker volume details
   */
  static async getDockerVolumeDetails(
    volumeName: string
  ): Promise<DockerVolume> {
    try {
      const normalizedName = this.validateName(volumeName, "volume name");
      // First check if volume exists
      const { stdout: volumeExists } = await this.execDockerCommand(
        ["volume", "ls", "--format", "{{.Name}}", "--filter", `name=${normalizedName}`]
      );

      if (!volumeExists.trim()) {
        throw new Error(`Volume "${normalizedName}" not found`);
      }

      // Get detailed volume info
      const { stdout: volumeInfo } = await this.execDockerCommand(
        ["volume", "inspect", normalizedName]
      );

      const volumeDetails = JSON.parse(volumeInfo)[0];

      // Get containers using this volume
      const { stdout: containerList } = await this.execDockerCommand(
        ["ps", "-a", "--format", "{{.ID}}|{{.Names}}", "--filter", `volume=${normalizedName}`]
      );

      const usedBy = [];
      if (containerList.trim()) {
        const containerLines = containerList.trim().split("\n");
        for (const containerLine of containerLines) {
          const [containerId, containerName] = containerLine.split("|");

          // Get mount information for this container
          try {
            const { stdout: mountInfo } = await this.execDockerCommand(
              ["inspect", containerId, "--format", "{{json .Mounts}}"]
            );

            const mounts = JSON.parse(mountInfo);
            const volumeMounts = mounts.filter(
              (mount: any) => mount.Name === normalizedName
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
        const { stdout: sizeInfo } = await this.execCommand(
          "du",
          ["-sh", volumeDetails.Mountpoint],
          { logErrors: false }
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
      throw error;
    }
  }
}
