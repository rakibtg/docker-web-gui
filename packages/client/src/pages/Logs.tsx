import { Button } from "../components";
import { HiSearch, HiX } from "react-icons/hi";
import { PageWrapper } from "../components/PageWrapper";
import { MdRefresh, MdFilterList } from "react-icons/md";
import { useCallback, useEffect, useMemo, useState } from "react";

type AnonymousFilter = "all" | "true" | "false";

type LogEntry = {
  id: number;
  action: string;
  createdAt: string;
  isAnonymous: boolean;
  status?: string | null;
  userId?: string | null;
  message?: string | null;
  username?: string | null;
  ipAddress?: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  metadata?: Record<string, unknown> | null;
};

type LogsResponse = {
  data: LogEntry[];
  meta?: {
    page?: number;
    total?: number;
    pageSize?: number;
  };
};

const PAGE_SIZE = 20;

export function Logs() {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<{
    ip: string;
    action: string;
    status: string;
    username: string;
    anonymous: AnonymousFilter;
  }>({
    ip: "",
    action: "",
    status: "",
    username: "",
    anonymous: "all",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("limit", PAGE_SIZE.toString());
      params.set("page", page.toString());
      if (filters.action.trim()) params.set("action", filters.action.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.username.trim())
        params.set("username", filters.username.trim());
      if (filters.ip.trim()) params.set("ip", filters.ip.trim());
      if (filters.anonymous !== "all")
        params.set("anonymous", filters.anonymous);

      const response = await fetch(`/api/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch logs (${response.status})`);
      }

      const json: LogsResponse = await response.json();
      setLogs(json.data || []);
      setTotal(json.meta?.total ?? json.data?.length ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load logs right now."
      );
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLogs();
    return () => controller.abort();
  }, [fetchLogs]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | AnonymousFilter
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      action: "",
      status: "",
      username: "",
      ip: "",
      anonymous: "all",
    });
    setPage(1);
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.action.trim() !== "" ||
      filters.status !== "" ||
      filters.username.trim() !== "" ||
      filters.ip.trim() !== "" ||
      filters.anonymous !== "all",
    [filters]
  );

  const renderStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-gray-400">—</span>;
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

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
            Logs
          </h2>
          <button
            title="Refresh logs"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
          >
            <MdRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-600/50 rounded-sm">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            title={showFilters ? "Hide filters" : "Show filters"}
            onClick={() => setShowFilters(!showFilters)}
            size="md"
            variant={showFilters ? "primary" : "default"}
          >
            <MdFilterList className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800 border border-gray-700 rounded-sm p-5 shadow-lg shadow-black/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiSearch className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Filter Logs
              </h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors"
              >
                <HiX className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Action Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                placeholder="e.g. container_start"
                className="w-full rounded-sm bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {filters.action && (
                <button
                  onClick={() => handleFilterChange("action", "")}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-300"
                  aria-label="Clear action filter"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-sm bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Username Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={filters.username}
                onChange={(e) => handleFilterChange("username", e.target.value)}
                placeholder="Filter by user"
                className="w-full rounded-sm bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {filters.username && (
                <button
                  onClick={() => handleFilterChange("username", "")}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-300"
                  aria-label="Clear username filter"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* IP Address Filter */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                IP Address
              </label>
              <input
                type="text"
                value={filters.ip}
                onChange={(e) => handleFilterChange("ip", e.target.value)}
                placeholder="e.g. 192.168.1.10"
                className="w-full rounded-sm bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {filters.ip && (
                <button
                  onClick={() => handleFilterChange("ip", "")}
                  className="absolute right-2 top-8 text-gray-500 hover:text-gray-300"
                  aria-label="Clear IP address filter"
                >
                  <HiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Anonymous Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                User Type
              </label>
              <select
                value={filters.anonymous}
                onChange={(e) =>
                  handleFilterChange(
                    "anonymous",
                    e.target.value as AnonymousFilter
                  )
                }
                className="w-full rounded-sm bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
                aria-label="Filter by user type"
              >
                <option value="all">All Users</option>
                <option value="false">Authenticated</option>
                <option value="true">Anonymous</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {total > 0
                  ? `Found ${total} log${
                      total !== 1 ? "s" : ""
                    } · Showing ${PAGE_SIZE} per page`
                  : "No logs match the current filters"}
              </span>
              <span className="text-gray-500">
                Page {page} of {totalPages || 1}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-sm overflow-hidden shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    Loading logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-red-300"
                  >
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No logs found for this view.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-900/60 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm font-semibold text-gray-100">
                        {log.action}
                      </div>
                      {log.resourceType && (
                        <div className="text-xs text-gray-400">
                          {log.resourceType}
                          {log.resourceId ? ` · ${log.resourceId}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {renderStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-gray-100">
                        {log.isAnonymous
                          ? "Anonymous"
                          : log.username || log.userId || "User"}
                      </div>
                      {!log.isAnonymous && log.userId && (
                        <div className="text-xs text-gray-400">
                          {log.userId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-100">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-100">
                      <div className="text-sm text-gray-100">
                        {log.message || "—"}
                      </div>
                      {log.metadata && (
                        <pre className="mt-2 text-xs text-gray-300 bg-gray-900/80 border border-gray-700 rounded-lg p-2 overflow-x-auto max-w-xl">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-gray-100 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="text-sm text-gray-400">
          {total > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1} - ${Math.min(
                page * PAGE_SIZE,
                total
              )} of ${total} logs`
            : "No logs to display"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            size="md"
            className={page <= 1 || loading ? "text-gray-500" : ""}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
              )
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <div key={p} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-gray-500">…</span>
                    )}
                    <Button
                      onClick={() => setPage(p)}
                      size="md"
                      variant={p === page ? "primary" : "default"}
                    >
                      {p}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            size="md"
            className={page >= totalPages || loading ? "text-gray-500" : ""}
          >
            Next
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
