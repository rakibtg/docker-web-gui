import { execFile } from "child_process";
import { promisify } from "util";
import { DockerAvailabilityResult } from "./types";

const execFileAsync = promisify(execFile);

export class BaseDockerService {
  // Strict patterns to prevent injection attacks
  private static readonly containerIdPattern = /^[a-f0-9]{12,64}$/i;
  private static readonly imageIdPattern = /^(sha256:)?[a-f0-9]{12,64}$/i;
  private static readonly namePattern = /^[A-Za-z0-9_.-]+$/;
  // Whitelist of allowed shell paths to prevent command injection
  private static readonly allowedShells = [
    "/bin/sh",
    "/bin/bash",
    "/bin/ash",
    "/bin/zsh",
    "/bin/dash",
  ];
  private static readonly defaultMaxBuffer = 10 * 1024 * 1024;

  /**
   * Check if Docker is available and accessible
   */
  static async checkDockerAvailability(): Promise<DockerAvailabilityResult> {
    try {
      await this.execDockerCommand(["--version"]);

      // Test if we can actually run docker commands
      try {
        await this.execDockerCommand(["info"]);
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
  protected static async execCommand(
    command: string,
    args: string[],
    options?: { logErrors?: boolean; maxBuffer?: number }
  ): Promise<{ stdout: string; stderr: string }> {
    const { logErrors = true, maxBuffer = BaseDockerService.defaultMaxBuffer } =
      options || {};

    try {
      return await execFileAsync(command, args, { maxBuffer });
    } catch (error) {
      if (logErrors) {
        console.error(
          `Error executing command: ${command} ${args.join(" ")}`,
          error
        );
      }
      throw error;
    }
  }

  static async execDockerCommand(
    args: string[],
    options?: { logErrors?: boolean; maxBuffer?: number }
  ): Promise<{ stdout: string; stderr: string }> {
    try {
      return await this.execCommand("docker", args, options);
    } catch (error) {
      const stderr =
        typeof (error as any)?.stderr === "string"
          ? (error as any).stderr
          : (error as any)?.stderr?.toString?.() || "";
      const stdout =
        typeof (error as any)?.stdout === "string"
          ? (error as any).stdout
          : (error as any)?.stdout?.toString?.() || "";
      const message =
        typeof (error as any)?.message === "string"
          ? (error as any).message
          : "";
      const combinedMessage = [stderr, stdout, message]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (combinedMessage.includes("permission denied")) {
        throw new Error(
          "Docker permission denied. Please ensure the current user is in the docker group. Run: sudo usermod -aG docker $USER && newgrp docker"
        );
      }

      if (combinedMessage.includes("Cannot connect to the Docker daemon")) {
        throw new Error(
          "Docker daemon is not running. Please start Docker service."
        );
      }

      throw new Error(
        `Failed to execute Docker command: ${
          combinedMessage || "Unknown error"
        }`
      );
    }
  }

  protected static validateContainerId(containerId: string): string {
    if (!containerId || typeof containerId !== "string") {
      throw new Error("Container ID must be a non-empty string");
    }

    const normalized = containerId.trim();

    // Check for reasonable length (container names and IDs are typically 1-64 chars)
    if (normalized.length < 1 || normalized.length > 64) {
      throw new Error("Invalid container ID length");
    }

    // Check for null bytes or control characters (prevents injection)
    if (/[\x00-\x1F\x7F]/.test(normalized)) {
      throw new Error("Container ID contains invalid control characters");
    }

    // Check for shell metacharacters and dangerous patterns (prevents command injection)
    // Allow: letters, numbers, underscores, hyphens, dots (valid for container names and IDs)
    // Block: semicolons, pipes, ampersands, dollar signs, backticks, etc.
    if (/[;&|$`\\(){}<>\s"']/.test(normalized)) {
      throw new Error("Container ID contains invalid characters");
    }

    // Must match either:
    // 1. Container ID pattern (hex, 12-64 chars) OR
    // 2. Container name pattern (alphanumeric + _.- chars)
    const isValidId = this.containerIdPattern.test(normalized);
    const isValidName = this.namePattern.test(normalized);

    if (!isValidId && !isValidName) {
      throw new Error("Invalid container ID or name format");
    }

    return normalized;
  }

  /**
   * Validate shell path against whitelist to prevent command injection
   */
  protected static validateShellPath(shellPath: string): string {
    if (!shellPath || typeof shellPath !== "string") {
      throw new Error("Shell path must be a non-empty string");
    }

    const normalized = shellPath.trim();

    // Must be in whitelist
    if (!this.allowedShells.includes(normalized)) {
      throw new Error(
        `Shell path not allowed. Allowed shells: ${this.allowedShells.join(
          ", "
        )}`
      );
    }

    // Additional check: must start with /bin/
    if (!normalized.startsWith("/bin/")) {
      throw new Error("Shell path must be in /bin/ directory");
    }

    // Check for path traversal attempts
    if (normalized.includes("..") || normalized.includes("//")) {
      throw new Error("Shell path contains invalid sequences");
    }

    // Check for null bytes or control characters
    if (/[\x00-\x1F\x7F]/.test(normalized)) {
      throw new Error("Shell path contains invalid control characters");
    }

    // Ensure no spaces or special shell characters
    if (/[\s;|&$`\\()<>]/.test(normalized)) {
      throw new Error("Shell path contains invalid characters");
    }

    return normalized;
  }

  protected static validateImageId(imageId: string): string {
    const normalized = imageId.trim();
    if (!this.imageIdPattern.test(normalized)) {
      throw new Error("Invalid image ID");
    }
    return normalized;
  }

  protected static validateName(name: string, label: string): string {
    const normalized = name.trim();
    if (!this.namePattern.test(normalized)) {
      throw new Error(`Invalid ${label}`);
    }
    return normalized;
  }
}
