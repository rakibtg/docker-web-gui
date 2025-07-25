import { useState, useEffect } from "react";

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    disk: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      // CPU usage simulation based on page activity
      const now = performance.now();
      const cpuBase = Math.sin(now / 10000) * 15 + 25; // Oscillating base
      const cpuNoise = Math.random() * 20; // Random fluctuation
      const cpu = Math.max(0, Math.min(100, cpuBase + cpuNoise));

      // Memory usage from browser memory API if available
      let memory = 45; // Default fallback
      if ("memory" in performance) {
        const memInfo = (performance as Performance & { memory?: MemoryInfo })
          .memory;
        if (memInfo?.usedJSHeapSize && memInfo?.totalJSHeapSize) {
          memory = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
        }
      } else {
        // Simulate memory usage
        memory = Math.sin(now / 15000) * 20 + 50 + Math.random() * 10;
      }

      // Disk usage simulation (more stable)
      const diskBase = 78;
      const diskVariation = Math.sin(now / 30000) * 5; // Slow oscillation
      const disk = Math.max(0, Math.min(100, diskBase + diskVariation));

      setStats({
        cpu: Math.round(cpu * 10) / 10,
        memory: Math.round(memory * 10) / 10,
        disk: Math.round(disk * 10) / 10,
      });
    };

    // Update immediately
    updateStats();

    // Then update every 2 seconds
    const intervalId = setInterval(updateStats, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return stats;
}
