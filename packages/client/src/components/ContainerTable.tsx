import { useState } from "react";
import { ToggleSwitch } from "./ToggleSwitch";
import { UptimeDisplay } from "./UptimeDisplay";
import type { ContainerWithStats } from "../types";

interface ContainerTableProps {
  containers: ContainerWithStats[];
  onContainerToggle: (containerId: string, currentState: string) => void;
  onOpenTerminal?: (containerId: string, containerName: string) => void;
}

export function ContainerTable({
  containers,
  onContainerToggle,
  onOpenTerminal,
}: ContainerTableProps) {
  const [togglingContainers, setTogglingContainers] = useState<Set<string>>(
    new Set()
  );

  if (containers.length === 0) {
    return null;
  }

  const handleToggle = async (containerId: string, currentState: string) => {
    setTogglingContainers((prev) => new Set(prev).add(containerId));
    try {
      await onContainerToggle(containerId, currentState);
    } finally {
      // Remove from toggling set after a delay to show feedback
      setTimeout(() => {
        setTogglingContainers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(containerId);
          return newSet;
        });
      }, 1000);
    }
  };

  return (
    <div className="bg-theme-card rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-theme-tertiary border-b border-theme">
        <h2 className="text-lg font-semibold text-theme-primary">
          Containers ({containers.length})
        </h2>
        <p className="text-sm text-theme-secondary mt-1">
          Real-time stats are displayed for running containers
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme">
          <thead className="bg-theme-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Name & ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                CPU %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Memory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Network I/O
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Ports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-card divide-y divide-theme">
            {containers.map((container) => (
              <tr
                key={container.id}
                className="hover:bg-theme-tertiary transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">
                  {container.name}
                  <div className="whitespace-nowrap text-sm text-gray-600 font-mono pt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {container.id.substring(0, 12)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className="truncate max-w-xs block"
                    title={container.image}
                  >
                    {container.image}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <UptimeDisplay
                    status={container.status}
                    state={container.state}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      container.state === "running"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.state === "running" && container.stats ? (
                    <span className="text-blue-600 font-mono">
                      {container.stats.cpuPerc}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.state === "running" && container.stats ? (
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-gray-600">
                        {container.stats.memUsage}
                      </div>
                      <div className="text-xs font-mono text-blue-600">
                        {container.stats.memPerc}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.state === "running" && container.stats ? (
                    <span className="text-xs font-mono text-gray-600">
                      {container.stats.netIO}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.ports || "None"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    {/* Terminal button (only for running containers) */}
                    {container.state === "running" && onOpenTerminal && (
                      <button
                        onClick={() =>
                          onOpenTerminal(container.id, container.name)
                        }
                        className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded"
                        title="Open terminal"
                        aria-label="Open terminal"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                    <ToggleSwitch
                      isOn={container.state === "running"}
                      onToggle={() =>
                        handleToggle(container.id, container.state)
                      }
                      loading={togglingContainers.has(container.id)}
                      disabled={togglingContainers.has(container.id)}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
