import { memo } from "react";
import { Button } from "./Button";

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
    const colorVariants = {
      red: "danger",
      blue: "primary",
      green: "success",
      yellow: "warning",
      orange: "warning",
    } as const;
    const resolvedVariant =
      variant === "danger" ? "danger" : colorVariants[color];

    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant={resolvedVariant}
        size="xl"
        className="min-w-0 flex-1 font-medium transition-all duration-200 justify-start"
      >
        {icon}
        <span className="truncate">{label}</span>
      </Button>
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
