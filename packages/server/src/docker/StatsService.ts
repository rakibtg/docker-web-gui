import { spawn } from "child_process";
import { EventEmitter } from "events";
import { DockerStats, ContainerWithStats } from "./types";
import { ContainerService } from "./ContainerService";

export class StatsService extends EventEmitter {
  private statsProcess: any = null;
  private isStreaming = false;

  /**
   * Parse docker stats output line
   */
  private parseStatsLine(line: string): DockerStats | null {
    try {
      const parts = line.split(/\s+/);
      if (parts.length < 8) return null;

      return {
        id: parts[0],
        name: parts[1],
        cpuPerc: parts[2],
        memUsage: parts[3] + " / " + parts[5],
        memPerc: parts[6],
        netIO: parts[7] + " / " + parts[9],
        blockIO: parts[10] + " / " + parts[12],
        pids: parts[13] || "0",
      };
    } catch (error) {
      console.error("Error parsing stats line:", line, error);
      return null;
    }
  }

  /**
   * Start streaming container stats
   */
  startStatsStreaming(): void {
    if (this.isStreaming) {
      console.log("Stats streaming already active");
      return;
    }

    this.isStreaming = true;
    console.log("Starting Docker stats streaming...");

    // Use docker stats --no-stream first to get headers, then stream
    this.statsProcess = spawn("docker", [
      "stats",
      "--format",
      "table {{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}\t{{.PIDs}}",
    ]);

    let isFirstOutput = true;

    this.statsProcess.stdout.on("data", async (data: Buffer) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim());

      for (const line of lines) {
        // Skip header line
        if (isFirstOutput && line.includes("CONTAINER")) {
          isFirstOutput = false;
          continue;
        }

        if (line.trim()) {
          const stats = this.parseStatsLine(line);
          if (stats) {
            // Get container details and combine with stats
            try {
              const containers = await ContainerService.getDockerContainers();
              const container = containers.find(
                (c) => c.id.startsWith(stats.id) || c.name === stats.name
              );

              if (container) {
                const containerWithStats: ContainerWithStats = {
                  ...container,
                  stats,
                };
                this.emit("stats", containerWithStats);
              }
            } catch (error) {
              console.error(
                "Error getting container details for stats:",
                error
              );
            }
          }
        }
      }
    });

    this.statsProcess.stderr.on("data", (data: Buffer) => {
      console.error("Docker stats error:", data.toString());
      this.emit("error", new Error(data.toString()));
    });

    this.statsProcess.on("close", (code: number) => {
      console.log(`Docker stats process closed with code ${code}`);
      this.isStreaming = false;
      this.emit("close", code);
    });

    this.statsProcess.on("error", (error: Error) => {
      console.error("Docker stats process error:", error);
      this.isStreaming = false;
      this.emit("error", error);
    });
  }

  /**
   * Stop streaming container stats
   */
  stopStatsStreaming(): void {
    if (this.statsProcess && this.isStreaming) {
      console.log("Stopping Docker stats streaming...");
      this.statsProcess.kill("SIGTERM");
      this.statsProcess = null;
      this.isStreaming = false;
    }
  }

  /**
   * Get current streaming status
   */
  isStatsStreaming(): boolean {
    return this.isStreaming;
  }
}
