import * as os from "os";
import { readFileSync, existsSync, statfsSync } from "fs";
import { join, resolve, isAbsolute } from "path";

interface CpuSample {
  idle: number;
  total: number;
}

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
}

let lastCpuSample: CpuSample | null = null;

function resolveEnvPath(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function getProcRoot(): string | null {
  const procRoot = resolveEnvPath(process.env.HOST_PROC, "/proc");
  return existsSync(procRoot) ? procRoot : null;
}

function getHostRoot(): string {
  return resolveEnvPath(process.env.HOST_ROOT, "/");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function readProcCpuSample(procRoot: string): CpuSample | null {
  const statPath = join(procRoot, "stat");
  if (!existsSync(statPath)) {
    return null;
  }

  try {
    const line = readFileSync(statPath, "utf8").split("\n")[0];
    if (!line) {
      return null;
    }

    const parts = line.trim().split(/\s+/).slice(1).map(Number);
    if (parts.length < 4 || parts.some(Number.isNaN)) {
      return null;
    }

    const idle = parts[3] + (parts[4] || 0);
    const total = parts.reduce((sum, value) => sum + value, 0);
    return { idle, total };
  } catch (error) {
    console.warn("Failed to read CPU stats:", error);
    return null;
  }
}

function readOsCpuSample(): CpuSample {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    const times = cpu.times;
    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  return { idle, total };
}

function calculateCpuUsage(sample: CpuSample): number {
  if (!lastCpuSample) {
    lastCpuSample = sample;
    return 0;
  }

  const idleDelta = sample.idle - lastCpuSample.idle;
  const totalDelta = sample.total - lastCpuSample.total;
  lastCpuSample = sample;

  if (totalDelta <= 0) {
    return 0;
  }
  const usage = (1 - idleDelta / totalDelta) * 100;
  return Math.min(100, Math.max(0, usage));
}

function getCpuUsage(): number {
  const procRoot = getProcRoot();
  const sample = procRoot ? readProcCpuSample(procRoot) : null;
  return calculateCpuUsage(sample || readOsCpuSample());
}

function parseMemInfo(contents: string): { total: number; available: number } {
  const lines = contents.split("\n");
  let total = 0;
  let available = 0;
  let free = 0;
  let buffers = 0;
  let cached = 0;

  for (const line of lines) {
    const parts = line.split(":");
    if (parts.length < 2) continue;
    const key = parts[0].trim();
    const value = parseInt(parts[1].trim().split(/\s+/)[0], 10);
    if (Number.isNaN(value)) continue;

    switch (key) {
      case "MemTotal":
        total = value;
        break;
      case "MemAvailable":
        available = value;
        break;
      case "MemFree":
        free = value;
        break;
      case "Buffers":
        buffers = value;
        break;
      case "Cached":
        cached = value;
        break;
      default:
        break;
    }
  }

  if (!available && free) {
    available = free + buffers + cached;
  }

  return { total, available };
}

function getMemoryUsage(): number {
  const procRoot = getProcRoot();
  if (procRoot) {
    const meminfoPath = join(procRoot, "meminfo");
    if (existsSync(meminfoPath)) {
      try {
        const meminfo = readFileSync(meminfoPath, "utf8");
        const { total, available } = parseMemInfo(meminfo);
        if (total > 0) {
          const used = total - Math.min(available, total);
          return Math.min(100, Math.max(0, (used / total) * 100));
        }
      } catch (error) {
        console.warn("Failed to read memory stats:", error);
      }
    }
  }

  const total = os.totalmem();
  const free = os.freemem();
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, ((total - free) / total) * 100));
}

function getDiskUsage(): number {
  const hostRoot = getHostRoot();
  if (!existsSync(hostRoot)) {
    return 0;
  }
  try {
    const stats = statfsSync(hostRoot);
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bavail;
    if (total <= 0) {
      return 0;
    }
    const used = total - free;
    return Math.min(100, Math.max(0, (used / total) * 100));
  } catch (error) {
    console.warn("Failed to read disk usage:", error);
    return 0;
  }
}

export function getSystemStats(): SystemStats {
  return {
    cpu: round1(getCpuUsage()),
    memory: round1(getMemoryUsage()),
    disk: round1(getDiskUsage()),
  };
}
