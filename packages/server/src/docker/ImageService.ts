import { BaseDockerService } from "./BaseDockerService";
import {
  DockerImage,
  DockerImageDetails,
  DockerOperationResult,
} from "./types";

export class ImageService extends BaseDockerService {
  /**
   * Get detailed information about a specific Docker image
   */
  static async getDockerImageDetails(
    imageId: string
  ): Promise<DockerImageDetails> {
    try {
      // Get detailed image inspection directly - this is more reliable
      const { stdout: inspectOutput } = await this.execDockerCommand(
        `docker inspect ${imageId}`
      );

      const inspectData = JSON.parse(inspectOutput)[0];

      if (!inspectData) {
        throw new Error(`Image with ID ${imageId} not found`);
      }

      // Build the detailed image object from inspect data
      const imageDetails: DockerImageDetails = {
        id: inspectData.RepoTags?.[0] || `${imageId}:latest`,
        repository: inspectData.RepoTags?.[0]?.split(":")[0] || "unknown",
        tag: inspectData.RepoTags?.[0]?.split(":")[1] || "latest",
        size: inspectData.Size
          ? (inspectData.Size / (1024 * 1024)).toFixed(1) + " MB"
          : "Unknown",
        created: inspectData.Created || "",
        imageId: inspectData.Id || imageId,
        architecture: inspectData.Architecture,
        os: inspectData.Os,
        parent: inspectData.Parent,
        config: {
          hostname: inspectData.Config?.Hostname,
          domainname: inspectData.Config?.Domainname,
          user: inspectData.Config?.User,
          attachStdin: inspectData.Config?.AttachStdin,
          attachStdout: inspectData.Config?.AttachStdout,
          attachStderr: inspectData.Config?.AttachStderr,
          tty: inspectData.Config?.Tty,
          openStdin: inspectData.Config?.OpenStdin,
          stdinOnce: inspectData.Config?.StdinOnce,
          env: inspectData.Config?.Env,
          cmd: inspectData.Config?.Cmd,
          image: inspectData.Config?.Image,
          volumes: inspectData.Config?.Volumes,
          workingDir: inspectData.Config?.WorkingDir,
          entrypoint: inspectData.Config?.Entrypoint,
          networkDisabled: inspectData.Config?.NetworkDisabled,
          macAddress: inspectData.Config?.MacAddress,
          onBuild: inspectData.Config?.OnBuild,
          labels: inspectData.Config?.Labels,
          shell: inspectData.Config?.Shell,
        },
        rootFS: {
          type: inspectData.RootFS?.Type,
          layers: inspectData.RootFS?.Layers,
        },
      };

      return imageDetails;
    } catch (error) {
      console.error("Error getting Docker image details:", error);
      throw error;
    }
  }

  /**
   * Get all Docker images
   */
  static async getDockerImages(): Promise<DockerImage[]> {
    try {
      const { stdout } = await this.execDockerCommand(
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
      throw error;
    }
  }

  /**
   * Remove a Docker image
   */
  static async removeImage(
    imageId: string,
    force: boolean = false
  ): Promise<DockerOperationResult> {
    try {
      const command = force
        ? `docker rmi -f ${imageId}`
        : `docker rmi ${imageId}`;
      const { stdout } = await this.execDockerCommand(command);
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

  /**
   * Prune unused images
   */
  static async pruneImages(all: boolean = false): Promise<DockerOperationResult> {
    try {
      const command = all
        ? "docker image prune -a -f"
        : "docker image prune -f";
      const { stdout, stderr } = await this.execDockerCommand(command);

      if (stderr && !stderr.includes("WARNING")) {
        console.error("Docker image prune stderr:", stderr);
      }

      const lines = stdout.split("\n").map((line) => line.trim());
      const deletedImages: string[] = [];
      let reclaimedSpace = "0B";
      let collecting = false;

      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith("Deleted Images:")) {
          collecting = true;
          continue;
        }
        if (line.startsWith("Total reclaimed space")) {
          reclaimedSpace = line.split("Total reclaimed space:")[1]?.trim() || "0B";
          collecting = false;
          continue;
        }
        if (collecting) {
          deletedImages.push(line);
        }
      }

      return {
        success: true,
        data: { deletedImages, reclaimedSpace, scope: all ? "all" : "dangling" },
        message: `Pruned ${deletedImages.length} ${all ? "unused" : "dangling"} images, reclaimed ${reclaimedSpace}`,
      };
    } catch (error: any) {
      console.error("Error pruning images:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to prune images",
      };
    }
  }

  /**
   * Get image history
   */
  static async getImageHistory(
    imageId: string
  ): Promise<DockerOperationResult> {
    try {
      const { stdout } = await this.execDockerCommand(
        `docker history ${imageId} --format "table {{.ID}}\\t{{.CreatedBy}}\\t{{.Size}}\\t{{.CreatedSince}}" --no-trunc`
      );

      const lines = stdout.trim().split("\n");
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
}
