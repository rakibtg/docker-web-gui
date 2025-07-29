import { memo, useMemo } from "react";
import type { DockerVolume } from "../types";

interface VolumeFiltersProps {
  searchTerm: string;
  totalVolumes: number;
  selectedDriver: string;
  volumes: DockerVolume[];
  filteredVolumes: number;
  onSearch: (term: string) => void;
  onDriverFilter: (driver: string) => void;
}

const VolumeFilters = memo(function VolumeFilters({
  volumes,
  onSearch,
  searchTerm,
  totalVolumes,
  onDriverFilter,
  selectedDriver,
  filteredVolumes,
}: VolumeFiltersProps) {
  // Get unique drivers from volumes
  const drivers = useMemo(() => {
    const driverSet = new Set(volumes.map((volume) => volume.driver));
    return Array.from(driverSet).sort();
  }, [volumes]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>

      {/* Results summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
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
