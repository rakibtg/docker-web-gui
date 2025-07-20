import { spawn } from "child_process";
import { EventEmitter } from "events";
import { BaseDockerService } from "./BaseDockerService";

export class TerminalService extends BaseDockerService {
  /**
   * Create terminal session for container
   */
  static async createTerminalSession(containerId: string): Promise<any> {
    try {
      // Import node-pty
      const pty = require("node-pty");

      // First, detect which shell is available in the container
      let availableShell = "/bin/sh"; // Default fallback

      try {
        // Check for available shells in order of preference
        const shells = ["/bin/bash", "/bin/sh", "/bin/ash", "/bin/zsh"];

        for (const shell of shells) {
          try {
            await this.execDockerCommand(
              `docker exec ${containerId} test -f ${shell}`
            );
            availableShell = shell;
            console.log(`Found shell ${shell} in container ${containerId}`);
            break;
          } catch (error) {
            // Shell not found, try next one
            continue;
          }
        }
      } catch (error) {
        console.log(
          `Could not detect shell for container ${containerId}, using /bin/sh`
        );
      }

      // Create terminal with the detected shell
      const terminal = pty.spawn(
        "docker",
        ["exec", "-it", containerId, availableShell],
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
      // Create a logs process using docker logs with follow flag
      // Added --timestamps for better readability and limited tail to recent logs
      const logsProcess = spawn(
        "docker",
        ["logs", "-f", "--tail", "50", "--timestamps", containerId],
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
