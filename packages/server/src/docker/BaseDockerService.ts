import { exec } from "child_process";
import { promisify } from "util";
import { DockerAvailabilityResult } from "./types";

const execAsync = promisify(exec);

export class BaseDockerService {
  /**
   * Check if Docker is available and accessible
   */
  static async checkDockerAvailability(): Promise<DockerAvailabilityResult> {
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

  /**
   * Execute Docker command with proper error handling
   */
  static async execDockerCommand(
    command: string,
    options?: { logErrors?: boolean }
  ): Promise<{ stdout: string; stderr: string }> {
    const { logErrors = true } = options || {};

    try {
      return await execAsync(command);
    } catch (error) {
      if (logErrors) {
        console.error(`Error executing Docker command: ${command}`, error);
      }

      // Check for common Docker errors
      if (
        error instanceof Error &&
        error.message.includes("permission denied")
      ) {
        throw new Error(
          "Docker permission denied. Please ensure the current user is in the docker group. Run: sudo usermod -aG docker $USER && newgrp docker"
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
        `Failed to execute Docker command: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
