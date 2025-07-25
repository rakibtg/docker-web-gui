import { memo, useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  FaChartLine,
  FaMicrochip,
  FaMemory,
  FaNetworkWired,
  FaClock,
} from "react-icons/fa";
import type { ContainerWithStats } from "../types";

interface LiveStatisticsProps {
  containers: ContainerWithStats[];
  isStatsStreaming: boolean;
  onStartStatsStreaming: () => void;
  onStopStatsStreaming: () => void;
}

interface DataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  actualTime: Date;
}

type TimeRange = "30m" | "1h" | "2h" | "3h" | "6h";

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  minutes: number;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: "30m", label: "30 minutes", minutes: 30 },
  { value: "1h", label: "1 hour", minutes: 60 },
  { value: "2h", label: "2 hours", minutes: 120 },
  { value: "3h", label: "3 hours", minutes: 180 },
  { value: "6h", label: "6 hours", minutes: 360 },
];

export const LiveStatistics = memo(function LiveStatistics({
  containers,
  isStatsStreaming,
  onStartStatsStreaming,
  onStopStatsStreaming,
}: LiveStatisticsProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("30m");

  // Calculate how many data points we need based on time range
  // Assuming we get one data point every 5 seconds (12 per minute)
  const getMaxDataPoints = useCallback((range: TimeRange) => {
    const option = timeRangeOptions.find((opt) => opt.value === range);
    return option ? option.minutes * 12 : 360; // 12 points per minute
  }, []);

  // Calculate current statistics from running containers
  const currentStats = containers
    .filter((container) => container.state === "running" && container.stats)
    .reduce(
      (acc, container) => {
        if (container.stats) {
          // Parse CPU percentage
          const cpuPerc =
            parseFloat(container.stats.cpuPerc.replace("%", "")) || 0;

          // Parse memory percentage
          const memPerc =
            parseFloat(container.stats.memPerc.replace("%", "")) || 0;

          // Parse network I/O (simplified - just taking the first number)
          const netIO = container.stats.netIO.split("/")[0];
          const netValue = parseFloat(netIO.replace(/[^\d.]/g, "")) || 0;

          acc.cpu += cpuPerc;
          acc.memory += memPerc;
          acc.network += netValue;
        }
        return acc;
      },
      { cpu: 0, memory: 0, network: 0 }
    );

  // Update chart data when stats change
  useEffect(() => {
    if (isStatsStreaming && containers.some((c) => c.stats)) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString();

      setChartData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp,
            cpu: Number(currentStats.cpu.toFixed(1)),
            memory: Number(currentStats.memory.toFixed(1)),
            network: Number(currentStats.network.toFixed(1)),
            actualTime: now,
          },
        ];

        // Filter data based on selected time range and keep only recent data
        const cutoffTime = new Date(
          now.getTime() - (getMaxDataPoints(timeRange) / 12) * 60 * 1000
        );
        const filteredData = newData.filter(
          (point) => point.actualTime >= cutoffTime
        );

        return filteredData;
      });
    }
  }, [
    containers,
    currentStats.cpu,
    currentStats.memory,
    currentStats.network,
    isStatsStreaming,
    timeRange,
    getMaxDataPoints,
  ]);

  // Filter existing data when time range changes
  useEffect(() => {
    setChartData((prev) => {
      const now = new Date();
      const cutoffTime = new Date(
        now.getTime() - (getMaxDataPoints(timeRange) / 12) * 60 * 1000
      );
      return prev.filter((point) => point.actualTime >= cutoffTime);
    });
  }, [timeRange, getMaxDataPoints]);

  const MetricCard = ({
    title,
    value,
    unit,
    icon,
    color,
  }: {
    title: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <h4 className="text-sm font-medium text-gray-300">{title}</h4>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">
        {value.toFixed(1)}
        {unit}
      </div>
    </div>
  );

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      dataKey: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{`Time: ${label}`}</p>
          {payload.map((entry, index: number) => (
            <p
              key={index}
              className={`text-sm ${
                entry.dataKey === "cpu"
                  ? "text-blue-400"
                  : entry.dataKey === "memory"
                  ? "text-purple-400"
                  : "text-green-400"
              }`}
            >
              {`${entry.dataKey}: ${entry.value}${
                entry.dataKey === "cpu" || entry.dataKey === "memory" ? "%" : ""
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center space-x-2">
          <FaChartLine className="text-blue-500" />
          <span>Live Statistics</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <FaClock className="text-gray-400 w-4 h-4" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              title="Select time range for charts"
              className="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start/Stop Button */}
          <button
            onClick={
              isStatsStreaming ? onStopStatsStreaming : onStartStatsStreaming
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isStatsStreaming
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isStatsStreaming ? "Stop Monitoring" : "Start Monitoring"}
          </button>
        </div>
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="CPU Usage"
          value={currentStats.cpu}
          unit="%"
          icon={<FaMicrochip className="w-4 h-4 text-white" />}
          color="bg-blue-500/20"
        />
        <MetricCard
          title="Memory Usage"
          value={currentStats.memory}
          unit="%"
          icon={<FaMemory className="w-4 h-4 text-white" />}
          color="bg-purple-500/20"
        />
        <MetricCard
          title="Network I/O"
          value={currentStats.network}
          unit=""
          icon={<FaNetworkWired className="w-4 h-4 text-white" />}
          color="bg-green-500/20"
        />
      </div>

      {/* Charts */}
      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU & Memory Chart */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h4 className="text-sm font-medium text-gray-300 mb-4">
              CPU & Memory Usage (
              {timeRangeOptions.find((opt) => opt.value === timeRange)?.label})
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="CPU"
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name="Memory"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Network I/O Chart */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h4 className="text-sm font-medium text-gray-300 mb-4">
              Network Activity (
              {timeRangeOptions.find((opt) => opt.value === timeRange)?.label})
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: "#9CA3AF" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="network"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Network"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <FaChartLine className="mx-auto w-12 h-12 text-gray-600 mb-4" />
          <h4 className="text-lg font-medium text-gray-300 mb-2">
            No Statistics Data
          </h4>
          <p className="text-gray-500 mb-4">
            {!isStatsStreaming
              ? "Start monitoring to see real-time statistics"
              : "Waiting for statistics data..."}
          </p>
          {!isStatsStreaming && (
            <button
              onClick={onStartStatsStreaming}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Start Monitoring
            </button>
          )}
        </div>
      )}
    </div>
  );
});
