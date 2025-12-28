import { memo } from "react";

import {
  FaHdd,
  FaDocker,
  FaServer,
  FaMemory,
  FaMicrochip,
} from "react-icons/fa";

import { StatusIndicator } from "./StatusIndicator";
import { useSystemStats } from "../hooks/useSystemStats";

interface SystemOverviewProps {
  isConnected: boolean;
  dockerMessage: string;
  dockerAvailable: boolean | null;
}

export const SystemOverview = memo(function SystemOverview({
  isConnected,
  dockerMessage,
  dockerAvailable,
}: SystemOverviewProps) {
  // Get real system metrics
  const systemMetrics = useSystemStats();

  const getStatusColor = (value: number) => {
    if (value >= 80) return "text-red-500";
    if (value >= 60) return "text-yellow-500";
    return "text-green-500";
  };

  const CircularProgress = ({
    value,
    label,
    icon,
  }: {
    value: number;
    label: string;
    icon: React.ReactNode;
  }) => {
    const circumference = 2 * Math.PI * 20;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={getStatusColor(value).replace("text-", "stroke-")}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-xs font-bold ${getStatusColor(value)}`}>
                {value}%
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {icon}
          <span className="text-xs text-gray-400">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Docker Status Card */}
      <div className="bg-gray-800 rounded-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center space-x-2">
            <FaDocker className="text-blue-500" />
            <span>Docker System</span>
          </h3>
          <div className="flex space-x-2">
            <StatusIndicator
              status={isConnected ? "connected" : "disconnected"}
              label="Live"
              title="WebSocket Connection Status"
            />
            {dockerAvailable !== null && (
              <StatusIndicator
                status={dockerAvailable ? "available" : "unavailable"}
                label="Docker"
                title="Docker Availability Status"
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <FaServer className="text-gray-400 w-4 h-4" />
            <div>
              <div className="text-sm text-gray-300">Status</div>
              <div
                className={`text-sm font-medium ${
                  dockerAvailable ? "text-green-400" : "text-red-400"
                }`}
              >
                {dockerAvailable === null
                  ? "Checking..."
                  : dockerAvailable
                  ? "Running"
                  : "Unavailable"}
              </div>
            </div>
          </div>

          {dockerMessage && (
            <div className="text-xs text-gray-400 bg-gray-900 rounded p-2">
              {dockerMessage}
            </div>
          )}
        </div>
      </div>

      {/* System Resources Card */}
      <div className="bg-gray-800 rounded-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center space-x-2">
          <FaServer className="text-green-500" />
          <span>System Resources</span>
        </h3>

        <div className="flex justify-around">
          <CircularProgress
            value={systemMetrics.cpu}
            label="CPU"
            icon={<FaMicrochip className="w-3 h-3 text-blue-400" />}
          />
          <CircularProgress
            value={systemMetrics.memory}
            label="Memory"
            icon={<FaMemory className="w-3 h-3 text-purple-400" />}
          />
          <CircularProgress
            value={systemMetrics.disk}
            label="Disk"
            icon={<FaHdd className="w-3 h-3 text-orange-400" />}
          />
        </div>
      </div>
    </div>
  );
});
