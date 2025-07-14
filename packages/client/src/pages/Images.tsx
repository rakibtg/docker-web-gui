import { memo, useEffect } from "react";
import { ImageGrid, ImageFilters, ImageEmptyState } from "../components";
import { useImages } from "../hooks/useImages";
import { useApp } from "../hooks/useApp";

const Images = memo(function Images() {
  const { dockerAvailable, isConnected } = useApp();
  const {
    images,
    allImages,
    imagesLoading,
    requestImages,
    handleSearch,
    handleRemoveImage,
  } = useImages();

  // Load images on component mount
  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestImages();
    }
  }, [isConnected, dockerAvailable, requestImages]);

  return (
    <div className="space-y-6 p-4">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Images
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your Docker images - pull, remove, and view image details
        </p>
      </div>

      {allImages.length > 0 ? (
        <div className="space-y-6">
          <ImageFilters
            onSearch={handleSearch}
            totalImages={allImages.length}
            filteredImages={images.length}
          />

          <ImageGrid images={images} onImageRemove={handleRemoveImage} />
        </div>
      ) : (
        <ImageEmptyState
          dockerAvailable={dockerAvailable}
          isConnected={isConnected}
          loading={imagesLoading}
          onLoadImages={requestImages}
        />
      )}
    </div>
  );
});

export { Images };
