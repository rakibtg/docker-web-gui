import { memo } from "react";
import {
  FaPlay,
  FaStop,
  FaRedo,
  FaTrash,
  FaDownload,
  FaBroom,
  FaExclamationTriangle,
} from "react-icons/fa";

interface QuickActionsProps {
  onPruneSystem: () => void;
  unusedImagesCount: number;
  onPruneImages: () => void;
  unusedVolumesCount: number;
  onPruneVolumes: () => void;
  runningContainersCount: number;
  stoppedContainersCount: number;
  onStopAllContainers: () => void;
  onStartAllContainers: () => void;
}

export const QuickActions = memo(function QuickActions({
  onPruneSystem,
  onPruneImages,
  onPruneVolumes,
  unusedImagesCount,
  unusedVolumesCount,
  onStopAllContainers,
  onStartAllContainers,
  runningContainersCount,
  stoppedContainersCount,
}: QuickActionsProps) {
  const ActionButton = ({
    icon,
    label,
    onClick,
    color = "blue",
    disabled = false,
    variant = "normal",
  }: {
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
    variant?: "normal" | "danger";
    color?: "blue" | "green" | "red" | "yellow" | "orange";
  }) => {
    const colorClasses = {
      red: "bg-red-600 hover:bg-red-700 text-white",
      blue: "bg-blue-600 hover:bg-blue-700 text-white",
      green: "bg-green-600 hover:bg-green-700 text-white",
      yellow: "bg-yellow-600 hover:bg-yellow-700 text-white",
      orange: "bg-orange-600 hover:bg-orange-700 text-white",
    };

    const dangerClasses =
      "bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
          flex items-center space-x-2 min-w-0 flex-1
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variant === "danger" ? dangerClasses : colorClasses[color]}
        `}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center space-x-2">
        <FaRedo className="text-blue-500" />
        <span>Quick Actions</span>
      </h3>

      <div className="space-y-6">
        {/* Container Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Container Management
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionButton
              onClick={onStartAllContainers}
              icon={<FaPlay className="w-4 h-4" />}
              label={`Start All (${stoppedContainersCount})`}
              color="green"
              disabled={stoppedContainersCount === 0}
            />
            <ActionButton
              onClick={onStopAllContainers}
              icon={<FaStop className="w-4 h-4" />}
              label={`Stop All (${runningContainersCount})`}
              color="red"
              disabled={runningContainersCount === 0}
            />
          </div>
        </div>

        {/* Cleanup Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
            <span>Cleanup</span>
            <FaExclamationTriangle className="w-3 h-3 text-yellow-500" />
          </h4>
          <div className="space-y-3">
            <ActionButton
              onClick={onPruneImages}
              icon={<FaBroom className="w-4 h-4" />}
              label={`Clean Unused Images (${unusedImagesCount})`}
              color="yellow"
              disabled={unusedImagesCount === 0}
            />
            <ActionButton
              onClick={onPruneVolumes}
              icon={<FaTrash className="w-4 h-4" />}
              label={`Remove Unused Volumes (${unusedVolumesCount})`}
              color="orange"
              disabled={unusedVolumesCount === 0}
            />
            <ActionButton
              onClick={onPruneSystem}
              icon={<FaBroom className="w-4 h-4" />}
              label="System Cleanup"
              variant="danger"
            />
          </div>
        </div>

        {/* Additional Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">System</h4>
          <ActionButton
            onClick={() => window.location.reload()}
            icon={<FaDownload className="w-4 h-4" />}
            label="Refresh All Data"
            color="blue"
          />
        </div>
      </div>
    </div>
  );
});
