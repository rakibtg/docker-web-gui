import { useApp } from "./useApp";
import { useState, useCallback, useMemo } from "react";
import { filterImages, type ImageFilters } from "../helpers/filterImages";

export function useImages() {
  const { images, imagesLoading, requestImages, handleImageRemove } = useApp();

  const [filters, setFilters] = useState<ImageFilters>({
    searchQuery: "",
  });

  const filteredImages = useMemo(
    () => filterImages(images, filters),
    [images, filters]
  );

  const handleSearch = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const handleRemoveImage = useCallback(
    (imageId: string, force?: boolean) => {
      console.log("Removing image:", imageId, force ? "(force)" : "");
      handleImageRemove(imageId, force);
    },
    [handleImageRemove]
  );

  return {
    filters,
    handleSearch,
    imagesLoading,
    requestImages,
    allImages: images,
    handleRemoveImage,
    images: filteredImages,
  };
}
