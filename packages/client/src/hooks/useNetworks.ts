import { useState, useCallback, useMemo, useEffect } from "react";
import { useApp } from "./useApp";

export function useNetworks() {
  const { networks, networksLoading, requestNetworks } = useApp();
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

  // Filter networks based on search term and driver
  const filteredNetworks = useMemo(() => {
    return networks.filter((network) => {
      const matchesSearch =
        debouncedSearchTerm === "" ||
        network.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        network.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        network.driver
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesDriver =
        selectedDriver === "" || network.driver === selectedDriver;

      return matchesSearch && matchesDriver;
    });
  }, [networks, debouncedSearchTerm, selectedDriver]);

  // Sort networks to show user-created networks first, then built-in networks
  const sortedNetworks = useMemo(() => {
    const builtInNetworks = ["bridge", "host", "none"];

    return [...filteredNetworks].sort((a, b) => {
      const aIsBuiltIn = builtInNetworks.includes(a.name);
      const bIsBuiltIn = builtInNetworks.includes(b.name);

      // User-created networks first
      if (aIsBuiltIn && !bIsBuiltIn) return 1;
      if (!aIsBuiltIn && bIsBuiltIn) return -1;

      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [filteredNetworks]);

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
    networks: sortedNetworks,
    allNetworks: networks,
    networksLoading,
    searchTerm,
    selectedDriver,
    handleSearch,
    handleDriverFilter,
    resetFilters,
    requestNetworks,
  };
}
