import { HiViewGrid, HiViewList } from "react-icons/hi";

export type ContainerFilterStatus = "all" | "active" | "stopped";

interface ContainerFiltersProps {
  activeFilter: ContainerFilterStatus;
  onFilterChange: (filter: ContainerFilterStatus) => void;
}

export function ContainerFilters({ activeFilter, onFilterChange }: ContainerFiltersProps) {
  const filters = [
    {
      id: "all" as const,
      label: "All",
      icon: HiViewList,
    },
    {
      id: "active" as const,
      label: "Running",
      icon: HiViewGrid,
    },
    {
      id: "stopped" as const,
      label: "Stopped",
      icon: HiViewGrid,
    },
  ];

  return (
    <div className="flex items-center bg-theme-card rounded-lg border-theme border p-0.5">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center px-3 py-0.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
