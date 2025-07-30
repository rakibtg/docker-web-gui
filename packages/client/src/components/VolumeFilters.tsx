import { memo, useMemo } from "react";
import SearchInput from "./SearchInput";
import { FaFilter } from "react-icons/fa";
import type { DockerVolume } from "../types";

interface VolumeFiltersProps {
  searchTerm: string;
  selectedDriver: string;
  volumes: DockerVolume[];
  onSearch: (term: string) => void;
  onDriverFilter: (driver: string) => void;
}

const VolumeFilters = memo(function VolumeFilters({
  volumes,
  onSearch,
  searchTerm,
  onDriverFilter,
  selectedDriver,
}: VolumeFiltersProps) {
  const drivers = useMemo(() => {
    const driverSet = new Set(volumes.map((volume) => volume.driver));
    return Array.from(driverSet).sort();
  }, [volumes]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
      <SearchInput
        value={searchTerm}
        onChange={onSearch}
        placeholder="Search volumes by name or ID..."
      />

      <div className="relative">
        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3 h-3" />
        <select
          value={selectedDriver}
          onChange={(e) => onDriverFilter(e.target.value)}
          title="Filter by driver"
          className="pl-6 pr-8 py-[7.5px] text-sm bg-gray-800 rounded-lg border border-gray-600 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
  );
});

export { VolumeFilters };
