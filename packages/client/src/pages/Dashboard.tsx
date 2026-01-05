import { useApp } from "../hooks/useApp";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "../components/PageWrapper";
import { memo, useEffect, useMemo, useState } from "react";
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import { Button, SystemOverview, ResourceSummary } from "../components";

type RecentLog = {
  id: number;
  action: string;
  createdAt: string;
  isAnonymous: boolean;
  userId?: string | null;
  status?: string | null;
  message?: string | null;
  username?: string | null;
};

const Dashboard = memo(function Dashboard() {
  const navigate = useNavigate();
  const { summary } = useDashboardSummary();
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string>("");
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const { isConnected, dockerMessage, dockerAvailable } = useApp();

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogsError("");
      try {
        const response = await fetch("/api/logs?limit=10&page=1", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch logs (${response.status})`);
        }
        const json = await response.json();
        setRecentLogs(json.data || []);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setLogsError(error?.message || "Unable to load recent activity");
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
    return () => controller.abort();
  }, []);

  const renderStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-gray-400 text-xs">—</span>;
    const normalized = status.toLowerCase();
    const colors: Record<string, string> = {
      success: "bg-green-900/40 text-green-200 border border-green-600/50",
      failed: "bg-yellow-900/30 text-yellow-200 border border-yellow-600/40",
      error: "bg-red-900/40 text-red-200 border border-red-600/50",
    };
    const className =
      colors[normalized] || "bg-gray-800 text-gray-200 border border-gray-700";
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      >
        {status}
      </span>
    );
  };

  const recentLogsList = useMemo(() => {
    if (logsLoading) {
      return (
        <div className="text-gray-400 text-sm py-3">
          Loading recent activity…
        </div>
      );
    }
    if (logsError) {
      return <div className="text-red-300 text-sm py-3">{logsError}</div>;
    }
    if (!recentLogs.length) {
      return (
        <div className="text-gray-400 text-sm py-3">
          No activity captured yet.
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-800">
        {recentLogs.map((log) => (
          <li key={log.id} className="py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-100">
                  {log.action}
                </span>
                {renderStatusBadge(log.status)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {log.message || "—"}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {log.isAnonymous
                  ? "Anonymous"
                  : log.username || log.userId || "User"}
                {" · "}
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }, [logsLoading, logsError, recentLogs]);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
        <div className="relative">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
            Dashboard
          </h2>
        </div>
        <p className="text-sm text-gray-300 font-medium">
          Monitor and manage your Docker environment
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center mb-4">
            <h3 className="font-semibold text-gray-100 flex items-center space-x-2">
              <span>System Overview</span>
            </h3>
          </div>
          <SystemOverview
            dockerAvailable={dockerAvailable}
            isConnected={isConnected}
            dockerMessage={dockerMessage}
          />
        </section>

        <section>
          <div className="flex items-center mb-4">
            <h3 className="font-semibold text-gray-100 flex items-center space-x-2">
              <span>Resource Summary</span>
            </h3>
          </div>
          <ResourceSummary
            containerCount={summary.containers}
            imageCount={summary.images}
            networkCount={summary.networks}
            volumeCount={summary.volumes}
          />
        </section>

        <section>
          <div className="flex items-center mb-4 justify-between gap-2">
            <h3 className="font-semibold text-gray-100 flex items-center space-x-2">
              <span>Recent Activity</span>
            </h3>
            <Button onClick={() => navigate("/logs")}>See all logs</Button>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-sm p-4 shadow-lg shadow-black/20">
            {recentLogsList}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
});

export { Dashboard };
