import { memo } from "react";
import {
  FaDocker,
  FaPlay,
  FaStop,
  FaImage,
  FaNetworkWired,
  FaDatabase,
  FaExclamationTriangle,
  FaTrash,
} from "react-icons/fa";
import type {
  ContainerWithStats,
  DockerImage,
  DockerNetwork,
  DockerVolume,
} from "../types";

interface ResourceSummaryProps {
  containers: ContainerWithStats[];
  images: DockerImage[];
  networks: DockerNetwork[];
  volumes: DockerVolume[];
  onContainerToggle: (containerId: string, currentState: string) => void;
  onImagesPrune?: () => void;
  onVolumesPrune?: () => void;
}

export const ResourceSummary = memo(function ResourceSummary({
  containers,
  images,
  networks,
  volumes,
  onContainerToggle,
  onImagesPrune,
  onVolumesPrune,
}: ResourceSummaryProps) {
  const runningContainers = containers.filter((c) => c.state === "running");
  const stoppedContainers = containers.filter(
    (c) => c.state === "exited" || c.state === "stopped"
  );

  // Calculate image sizes
  const totalImageSize = images.reduce((total, image) => {
    const sizeStr = image.size || "0B";
    const sizeValue = parseFloat(sizeStr);
    let multiplier = 1;

    if (sizeStr.includes("KB")) multiplier = 1024;
    else if (sizeStr.includes("MB")) multiplier = 1024 * 1024;
    else if (sizeStr.includes("GB")) multiplier = 1024 * 1024 * 1024;

    return total + sizeValue * multiplier;
  }, 0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Find unused images (images not used by any container)
  const usedImageIds = new Set(containers.map((c) => c.image));
  const unusedImages = images.filter(
    (img) =>
      !usedImageIds.has(img.repository + ":" + img.tag) &&
      !usedImageIds.has(img.imageId)
  );

  const SummaryCard = ({
    title,
    icon,
    value,
    subtitle,
    color = "blue",
    actions,
  }: {
    title: string;
    icon: React.ReactNode;
    value: string | number;
    subtitle?: string;
    color?: "blue" | "green" | "yellow" | "red" | "purple";
    actions?: React.ReactNode;
  }) => {
    const colorClasses = {
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      green: "text-green-400 bg-green-500/10 border-green-500/20",
      yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
      red: "text-red-400 bg-red-500/10 border-red-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };

    return (
      <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-current/10`}>{icon}</div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">{title}</h3>
              <div className="text-2xl font-bold text-white">{value}</div>
              {subtitle && (
                <div className="text-xs text-gray-400">{subtitle}</div>
              )}
            </div>
          </div>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Containers Summary */}
      <SummaryCard
        title="Containers"
        icon={<FaDocker className="w-5 h-5" />}
        value={containers.length}
        subtitle={`${runningContainers.length} running, ${stoppedContainers.length} stopped`}
        color="blue"
        actions={
          <div className="flex space-x-1">
            <button
              onClick={() => {
                stoppedContainers.forEach((container) => {
                  onContainerToggle(container.id, container.state);
                });
              }}
              disabled={stoppedContainers.length === 0}
              className="p-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              title="Start all stopped containers"
            >
              <FaPlay className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                runningContainers.forEach((container) => {
                  onContainerToggle(container.id, container.state);
                });
              }}
              disabled={runningContainers.length === 0}
              className="p-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              title="Stop all running containers"
            >
              <FaStop className="w-3 h-3" />
            </button>
          </div>
        }
      />

      {/* Images Summary */}
      <SummaryCard
        title="Images"
        icon={<FaImage className="w-5 h-5" />}
        value={images.length}
        subtitle={`${formatSize(totalImageSize)} total, ${
          unusedImages.length
        } unused`}
        color="green"
        actions={
          unusedImages.length > 0 ? (
            <button
              onClick={onImagesPrune}
              className="p-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white text-xs flex items-center space-x-1"
              title="Clean up unused images"
            >
              <FaTrash className="w-3 h-3" />
              <FaExclamationTriangle className="w-3 h-3" />
            </button>
          ) : undefined
        }
      />

      {/* Networks Summary */}
      <SummaryCard
        title="Networks"
        icon={<FaNetworkWired className="w-5 h-5" />}
        value={networks.length}
        subtitle={`${
          networks.filter((n) => n.containers.length > 0).length
        } active`}
        color="purple"
      />

      {/* Volumes Summary */}
      <SummaryCard
        title="Volumes"
        icon={<FaDatabase className="w-5 h-5" />}
        value={volumes.length}
        subtitle={`${
          volumes.filter((v) => v.usedBy && v.usedBy.length > 0).length
        } in use`}
        color="yellow"
        actions={
          volumes.some((v) => !v.usedBy || v.usedBy.length === 0) ? (
            <button
              onClick={onVolumesPrune}
              className="p-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs flex items-center space-x-1"
              title="Clean up unused volumes"
            >
              <FaTrash className="w-3 h-3" />
              <FaExclamationTriangle className="w-3 h-3" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
});
