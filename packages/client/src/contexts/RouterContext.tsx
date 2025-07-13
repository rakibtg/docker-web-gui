import React, { createContext, useCallback, useEffect, useState } from "react";

// Define possible routes and their query parameters
export interface RouteParams {
  page?: string;
  tab?: string;
  containerId?: string;
  view?: string;
  filter?: string;
  [key: string]: string | undefined;
}

export interface RouterContextType {
  // Current query parameters
  params: RouteParams;

  // Navigation functions
  navigate: (newParams: RouteParams, replace?: boolean) => void;
  updateParam: (key: string, value: string | undefined) => void;
  updateParams: (newParams: Partial<RouteParams>) => void;

  // Utility functions
  getParam: (key: string) => string | undefined;
  hasParam: (key: string) => boolean;
  clearParams: () => void;

  // Route matching
  isRoute: (routeParams: Partial<RouteParams>) => boolean;
  getCurrentRoute: () => string;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<RouteParams>(() => {
    // Initialize from current URL query parameters
    if (typeof window === "undefined") {
      return {};
    }

    const searchParams = new URLSearchParams(window.location.search);
    const initialParams: RouteParams = {};

    for (const [key, value] of searchParams.entries()) {
      initialParams[key] = value;
    }

    return initialParams;
  });

  // Update URL when params change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams();

    // Add all non-undefined params to search params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });

    const newSearch = searchParams.toString();
    const currentSearch = window.location.search.slice(1); // Remove the '?' prefix

    // Only update if the search params have actually changed
    if (newSearch !== currentSearch) {
      const newUrl = `${window.location.pathname}${
        newSearch ? `?${newSearch}` : ""
      }`;
      window.history.pushState({}, "", newUrl);
    }
  }, [params]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const newParams: RouteParams = {};

      for (const [key, value] of searchParams.entries()) {
        newParams[key] = value;
      }

      setParams(newParams);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((newParams: RouteParams, replace = false) => {
    if (replace) {
      setParams(newParams);
    } else {
      setParams((prev) => ({ ...prev, ...newParams }));
    }
  }, []);

  const updateParam = useCallback((key: string, value: string | undefined) => {
    setParams((prev) => {
      const newParams = { ...prev };
      if (value === undefined || value === null || value === "") {
        delete newParams[key];
      } else {
        newParams[key] = value;
      }
      return newParams;
    });
  }, []);

  const updateParams = useCallback((newParams: Partial<RouteParams>) => {
    setParams((prev) => {
      const updated = { ...prev };

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          delete updated[key];
        } else {
          updated[key] = value;
        }
      });

      return updated;
    });
  }, []);

  const getParam = useCallback(
    (key: string): string | undefined => {
      return params[key];
    },
    [params]
  );

  const hasParam = useCallback(
    (key: string): boolean => {
      return (
        params[key] !== undefined && params[key] !== null && params[key] !== ""
      );
    },
    [params]
  );

  const clearParams = useCallback(() => {
    setParams({});
  }, []);

  const isRoute = useCallback(
    (routeParams: Partial<RouteParams>): boolean => {
      return Object.entries(routeParams).every(([key, value]) => {
        return params[key] === value;
      });
    },
    [params]
  );

  const getCurrentRoute = useCallback((): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, value);
      }
    });
    return searchParams.toString();
  }, [params]);

  const contextValue: RouterContextType = {
    params,
    navigate,
    updateParam,
    updateParams,
    getParam,
    hasParam,
    clearParams,
    isRoute,
    getCurrentRoute,
  };

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

export { RouterContext };
