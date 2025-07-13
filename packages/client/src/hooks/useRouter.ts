import { useContext } from "react";
import {
  RouterContext,
  type RouterContextType,
} from "../contexts/RouterContext";

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
