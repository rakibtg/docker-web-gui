import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ContainerFilterStatus } from "../components/ContainerFilters";

// Hook for managing container filter status with React Router integration
export function useContainerFilterStatus(): [
  ContainerFilterStatus,
  (status: ContainerFilterStatus) => void
] {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current status from URL or default to "all"
  const currentStatus = useMemo((): ContainerFilterStatus => {
    const urlStatus = searchParams.get("byStatus");
    if (
      urlStatus === "active" ||
      urlStatus === "stopped" ||
      urlStatus === "all"
    ) {
      return urlStatus;
    }
    return "all";
  }, [searchParams]);

  // Update status function that syncs with URL
  const setStatus = useMemo(
    () => (status: ContainerFilterStatus) => {
      const newSearchParams = new URLSearchParams(searchParams);

      // Only update URL if the status is not the default "all"
      if (status === "all") {
        newSearchParams.delete("byStatus");
      } else {
        newSearchParams.set("byStatus", status);
      }

      setSearchParams(newSearchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return [currentStatus, setStatus];
}
