import { memo } from "react";
import SearchInput from "./SearchInput";
import { FaFilter } from "react-icons/fa";

interface NetworkFiltersProps {
  searchTerm: string;
  selectedDriver: string;
  onSearch: (searchTerm: string) => void;
  onDriverFilter: (driver: string) => void;
}

const NetworkFilters = memo(function NetworkFilters({
  onSearch,
  searchTerm,
  onDriverFilter,
  selectedDriver,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <SearchInput
            value={searchTerm}
            onChange={onSearch}
            placeholder="Search networks by name or ID..."
          />

          {/* Driver Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3 h-3" />
            <select
              value={selectedDriver}
              onChange={(e) => onDriverFilter(e.target.value)}
              title="Filter by driver"
              className="pl-6 pr-8 py-[7.5px] text-sm bg-gray-800 rounded-lg border border-gray-600 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
    </>
  );
});

export { NetworkFilters };
