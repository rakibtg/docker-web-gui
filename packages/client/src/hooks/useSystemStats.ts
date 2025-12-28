import { useState, useEffect, useRef } from "react";

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    disk: 0,
  });
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    const updateStats = async () => {
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;
      try {
        const response = await fetch("/api/system-stats", {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as Partial<SystemStats>;
        const cpu =
          typeof data.cpu === "number" && Number.isFinite(data.cpu)
            ? data.cpu
            : 0;
        const memory =
          typeof data.memory === "number" && Number.isFinite(data.memory)
            ? data.memory
            : 0;
        const disk =
          typeof data.disk === "number" && Number.isFinite(data.disk)
            ? data.disk
            : 0;
        setStats({ cpu, memory, disk });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.warn("Failed to fetch system stats:", error);
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Update immediately
    updateStats();

    // Then update every 2 seconds
    const intervalId = setInterval(updateStats, 2000);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  return stats;
}
