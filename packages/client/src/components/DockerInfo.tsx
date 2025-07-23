import { StatusIndicator } from "./StatusIndicator";
import { FaDocker, FaTimesCircle, FaQuestionCircle } from "react-icons/fa";

interface DockerInfoProps {
  dockerAvailable: boolean | null;
  isConnected: boolean;
}

export function DockerInfo({ dockerAvailable, isConnected }: DockerInfoProps) {
  const getDockerIcon = () => {
    if (dockerAvailable === null) {
      return (
        <FaQuestionCircle className="w-6 h-6 text-gray-400 animate-pulse" />
      );
    }

    if (!dockerAvailable) {
      return <FaTimesCircle className="w-6 h-6 text-red-500" />;
    }

    return <FaDocker className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div>
      <div className="bg-gray-800 rounded-lg shadow-sm border-gray-600 border p-2.5 px-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{getDockerIcon()}</div>

          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-100 transition-colors">
              {dockerAvailable === null
                ? "Checking system status..."
                : "System Status"}
            </h3>
          </div>

          <div className="flex gap-3">
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
      </div>
    </div>
  );
}
