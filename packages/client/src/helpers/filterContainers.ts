import type { ContainerWithStats } from "../types";
import type { ContainerFilterStatus } from "../components/ContainerFilters";

/**
 * Filters containers based on their status
 * @param containers - Array of containers to filter
 * @param filterStatus - Filter criteria ("all", "active", "stopped")
 * @returns Filtered array of containers
 */
export function filterContainers(
  containers: ContainerWithStats[],
  filterStatus: ContainerFilterStatus
): ContainerWithStats[] {
  if (filterStatus === "all") {
    return containers;
  }

  return containers.filter((container) => {
    const isRunning = container.state === "running" || container.status.toLowerCase().includes("up");
    
    if (filterStatus === "active") {
      return isRunning;
    } else if (filterStatus === "stopped") {
      return !isRunning;
    }
    
    return true;
  });
}
