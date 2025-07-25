import { useState, useEffect } from "react";
import { useApp } from "./useApp";

interface DashboardSummary {
  containers: number;
  images: number;
  networks: number;
  volumes: number;
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>({
    containers: 0,
    images: 0,
    networks: 0,
    volumes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const { websocket, isConnected } = useApp();

  useEffect(() => {
    if (!websocket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "dashboard-summary-result") {
          setSummary(message.data);
          setLoading(false);
          setError("");
        } else if (
          message.type === "error" &&
          message.message.includes("dashboard summary")
        ) {
          setError(message.message);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error parsing websocket message:", err);
      }
    };

    websocket.addEventListener("message", handleMessage);

    // Request dashboard summary data
    websocket.send(
      JSON.stringify({
        type: "get-dashboard-summary",
      })
    );

    return () => {
      websocket.removeEventListener("message", handleMessage);
    };
  }, [websocket, isConnected]);

  const refreshSummary = () => {
    if (websocket && isConnected) {
      setLoading(true);
      websocket.send(
        JSON.stringify({
          type: "get-dashboard-summary",
        })
      );
    }
  };

  return {
    summary,
    loading,
    error,
    refreshSummary,
  };
}
