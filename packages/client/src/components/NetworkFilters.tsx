import { memo } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

interface NetworkFiltersProps {
  onSearch: (searchTerm: string) => void;
  onDriverFilter: (driver: string) => void;
  totalNetworks: number;
  filteredNetworks: number;
  selectedDriver: string;
  searchTerm: string;
}

const NetworkFilters = memo(function NetworkFilters({
  onSearch,
  onDriverFilter,
  totalNetworks,
  filteredNetworks,
  selectedDriver,
  searchTerm,
}: NetworkFiltersProps) {
  const driverOptions = [
    { value: "", label: "All Drivers" },
    { value: "bridge", label: "Bridge" },
    { value: "host", label: "Host" },
    { value: "overlay", label: "Overlay" },
    { value: "macvlan", label: "Macvlan" },
    { value: "ipvlan", label: "IPvlan" },
    { value: "none", label: "None" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search networks..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Driver Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedDriver}
              onChange={(e) => onDriverFilter(e.target.value)}
              title="Filter by driver"
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {driverOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredNetworks} of {totalNetworks} networks
      </div>
    </>
  );
});

export { NetworkFilters };
