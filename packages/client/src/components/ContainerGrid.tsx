import { useApp } from "../hooks/useApp";
import { ContainerCard } from "./ContainerCard";
import type { ContainerWithStats } from "../types";
import { MdRefresh } from "react-icons/md";
import { HiViewGrid, HiViewList } from "react-icons/hi";

interface ContainerGridProps {
  containers: ContainerWithStats[];
  onContainerToggle: (containerId: string, currentState: string) => void;
  onOpenTerminal?: (containerId: string, containerName: string) => void;
}

export function ContainerGrid({
  containers,
  onContainerToggle,
  onOpenTerminal,
}: ContainerGridProps) {
  const { requestContainers, containerListStatus, setContainerListStatus } =
    useApp();

  if (containers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
            Containers{" "}
            <span className="text-sm text-gray-500 dark:text-gray-400 px-1">
              ({containers.length})
            </span>
          </h2>
          <button
            title="Refresh Containers"
            onClick={requestContainers}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
          >
            <MdRefresh className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center bg-theme-card rounded-lg border-theme border p-0.5">
          <button
            onClick={() => setContainerListStatus("all")}
            className={`flex items-center px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
              containerListStatus === "all"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            <HiViewList className="h-4 w-4 mr-2" />
            All
          </button>

          <button
            onClick={() => setContainerListStatus("active")}
            className={`flex items-center px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
              containerListStatus === "active"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            <HiViewGrid className="h-4 w-4 mr-2" />
            Active
          </button>

          <button
            onClick={() => setContainerListStatus("stopped")}
            className={`flex items-center px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
              containerListStatus === "stopped"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            <HiViewGrid className="h-4 w-4 mr-2" />
            Inactive
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onToggle={onContainerToggle}
            onOpenTerminal={onOpenTerminal}
          />
        ))}
      </div>
    </div>
  );
}
