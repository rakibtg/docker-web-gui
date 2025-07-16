import { memo, useMemo } from "react";
import type { DockerVolume } from "../types";
import { useApp } from "../hooks/useApp";

interface VolumeFiltersProps {
  onSearch: (term: string) => void;
  onDriverFilter: (driver: string) => void;
  totalVolumes: number;
  filteredVolumes: number;
  selectedDriver: string;
  searchTerm: string;
  volumes: DockerVolume[];
}

const VolumeFilters = memo(function VolumeFilters({
  onSearch,
  onDriverFilter,
  totalVolumes,
  filteredVolumes,
  selectedDriver,
  searchTerm,
  volumes,
}: VolumeFiltersProps) {
  const { handleVolumesPrune } = useApp();

  // Get unique drivers from volumes
  const drivers = useMemo(() => {
    const driverSet = new Set(volumes.map((volume) => volume.driver));
    return Array.from(driverSet).sort();
  }, [volumes]);

  const unusedVolumesCount = useMemo(() => {
    return volumes.filter(
      (volume) => !volume.usedBy || volume.usedBy.length === 0
    ).length;
  }, [volumes]);

  const handlePruneClick = () => {
    if (
      confirm(
        `Are you sure you want to prune ${unusedVolumesCount} unused volumes? This action cannot be undone.`
      )
    ) {
      handleVolumesPrune();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search volumes by name, driver, or mount point..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
                aria-label="Clear search"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Driver filter */}
        <div className="lg:w-48">
          <select
            value={selectedDriver}
            onChange={(e) => onDriverFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Filter by driver"
            aria-label="Filter volumes by driver"
          >
            <option value="">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver} value={driver}>
                {driver}
              </option>
            ))}
          </select>
        </div>

        {/* Prune button */}
        {unusedVolumesCount > 0 && (
          <button
            onClick={handlePruneClick}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            title={`Remove ${unusedVolumesCount} unused volumes`}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Prune ({unusedVolumesCount})</span>
          </button>
        )}
      </div>

      {/* Results summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {filteredVolumes} of {totalVolumes} volumes
          {selectedDriver && (
            <span className="ml-2">
              • Driver: <span className="font-medium">{selectedDriver}</span>
            </span>
          )}
        </div>

        {(searchTerm || selectedDriver) && (
          <button
            onClick={() => {
              onSearch("");
              onDriverFilter("");
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
});

export { VolumeFilters };
