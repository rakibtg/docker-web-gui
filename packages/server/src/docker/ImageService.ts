import { BaseDockerService } from "./BaseDockerService";
import { DockerImage, DockerOperationResult } from "./types";

export class ImageService extends BaseDockerService {
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
