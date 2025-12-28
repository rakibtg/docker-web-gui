import { spawn } from "child_process";
import { EventEmitter } from "events";
import { BaseDockerService } from "./BaseDockerService";

export class TerminalService extends BaseDockerService {
  /**
   * Create terminal session for container
   */
  static async createTerminalSession(containerId: string): Promise<any> {
    try {
      const normalizedId = this.validateContainerId(containerId);
      // Import node-pty
      const pty = require("node-pty");

      // First, detect which shell is available in the container
      let availableShell = "/bin/sh"; // Default fallback

      try {
        // Check for available shells in order of preference
        // These shells are validated against whitelist in BaseDockerService
        const shells = ["/bin/bash", "/bin/sh", "/bin/ash", "/bin/zsh"];

        for (const shell of shells) {
          try {
            // Validate shell path before using it
            const validatedShell = this.validateShellPath(shell);
            
            await this.execDockerCommand(
              ["exec", normalizedId, "test", "-f", validatedShell],
              {
                logErrors: false, // Shell probing is expected to fail for missing shells
              }
            );
            availableShell = validatedShell;
            console.log(`Found shell ${validatedShell} in container ${normalizedId}`);
            break;
          } catch (error) {
            // Shell not found or validation failed, try next one
            continue;
          }
        }
      } catch (error) {
        console.log(
          `Could not detect shell for container ${containerId}, using /bin/sh`
        );
      }

      // Final validation of shell path before spawning
      const validatedShell = this.validateShellPath(availableShell);
      
      // Create terminal with the validated shell
      // Using array format prevents shell injection - arguments are passed directly
      const terminal = pty.spawn(
        "docker",
        ["exec", "-it", normalizedId, validatedShell],
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

  /**
   * Create logs session for container
   */
  static async createLogsSession(containerId: string): Promise<any> {
    try {
      const normalizedId = this.validateContainerId(containerId);
      // Create a logs process using docker logs with follow flag
      // Added --timestamps for better readability and limited tail to recent logs
      const logsProcess = spawn(
        "docker",
        ["logs", "-f", "--tail", "50", "--timestamps", normalizedId],
        {
          stdio: ["pipe", "pipe", "pipe"],
          env: {
            ...process.env,
            // Ensure proper encoding
            LANG: "en_US.UTF-8",
            LC_ALL: "en_US.UTF-8",
          },
        }
      );

      const logsEmitter: any = new EventEmitter();

      let stdoutBuffer = "";
      let stderrBuffer = "";

      logsProcess.stdout.on("data", (data: Buffer) => {
        stdoutBuffer += data.toString("utf8");
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            logsEmitter.emit("data", line + "\r\n");
          }
        }
      });

      logsProcess.stderr.on("data", (data: Buffer) => {
        stderrBuffer += data.toString("utf8");
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            logsEmitter.emit("data", "\x1b[91m" + line + "\x1b[0m\r\n");
          }
        }
      });

      logsProcess.on("exit", (code: number, signal: string) => {
        if (stdoutBuffer.trim()) {
          logsEmitter.emit("data", stdoutBuffer + "\r\n");
        }
        if (stderrBuffer.trim()) {
          logsEmitter.emit("data", "\x1b[91m" + stderrBuffer + "\x1b[0m\r\n");
        }
        logsEmitter.emit("exit", code, signal);
      });

      logsProcess.on("error", (error: Error) => {
        logsEmitter.emit("error", error);
      });

      logsEmitter.kill = () => {
        logsProcess.kill("SIGTERM");
      };

      logsEmitter.resize = () => {
        // Skip (no-op for logs)
      };

      return logsEmitter;
    } catch (error) {
      console.error(
        `Error creating logs session for container ${containerId}:`,
        error
      );
      throw new Error(
        `Failed to create logs session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
