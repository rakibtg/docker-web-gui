import { useContext, useMemo } from "react";
import {
  RouterContext,
  type RouterContextType,
} from "../contexts/RouterContext";
import type { ContainerFilterStatus } from "../components/ContainerFilters";

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}

// Convenience hooks for common routing patterns
export function useRouteParam(
  key: string
): [string | undefined, (value: string | undefined) => void] {
  const { getParam, updateParam } = useRouter();
  const setValue = (value: string | undefined) => updateParam(key, value);
  return [getParam(key), setValue];
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useCurrentRoute() {
  const { getCurrentRoute } = useRouter();
  return getCurrentRoute();
}

// Custom hook for managing container filter status with router integration
export function useContainerFilterStatus(): [
  ContainerFilterStatus,
  (status: ContainerFilterStatus) => void
] {
  const { getParam, updateParam } = useRouter();

  // Get current status from URL or default to "all"
  const currentStatus = useMemo((): ContainerFilterStatus => {
    const urlStatus = getParam("byStatus");
    if (
      urlStatus === "active" ||
      urlStatus === "stopped" ||
      urlStatus === "all"
    ) {
      return urlStatus;
    }
    return "all";
  }, [getParam]);

  // Update status function that syncs with URL
  const setStatus = useMemo(
    () => (status: ContainerFilterStatus) => {
      // Only update URL if the status is not the default "all"
      if (status === "all") {
        updateParam("byStatus", undefined);
      } else {
        updateParam("byStatus", status);
      }
    },
    [updateParam]
  );

  return [currentStatus, setStatus];
}
