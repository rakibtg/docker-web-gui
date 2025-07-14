import { memo, useState, useCallback } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

interface ImageFiltersProps {
  onSearch?: (query: string) => void;
  totalImages: number;
  filteredImages: number;
}

const ImageFilters = memo(function ImageFilters({
  onSearch,
  totalImages,
  filteredImages,
}: ImageFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);
      onSearch?.(query);
    },
    [onSearch]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search images by name, tag, or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                         placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <FaFilter size={12} />
          <span>
            Showing {filteredImages} of {totalImages} images
          </span>
        </div>
      </div>
    </div>
  );
});

export { ImageFilters };
