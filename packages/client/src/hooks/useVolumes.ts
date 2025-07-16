import { useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "./useApp";

export function useVolumes() {
  const { volumes, volumesLoading, requestVolumes } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter volumes based on search term and driver
  const filteredVolumes = useMemo(() => {
    return volumes.filter((volume) => {
      const matchesSearch =
        debouncedSearchTerm === "" ||
        volume.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        volume.driver
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        volume.mountpoint
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesDriver =
        selectedDriver === "" || volume.driver === selectedDriver;

      return matchesSearch && matchesDriver;
    });
  }, [volumes, debouncedSearchTerm, selectedDriver]);

  // Sort volumes alphabetically
  const sortedVolumes = useMemo(() => {
    return [...filteredVolumes].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredVolumes]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleDriverFilter = useCallback((driver: string) => {
    setSelectedDriver(driver);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDriver("");
  }, []);

  return {
    volumes: sortedVolumes,
    allVolumes: volumes,
    volumesLoading,
    searchTerm,
    selectedDriver,
    handleSearch,
    handleDriverFilter,
    resetFilters,
    requestVolumes,
  };
}
