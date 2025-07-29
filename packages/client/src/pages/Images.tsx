import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { useImages } from "../hooks/useImages";
import SearchInput from "../components/SearchInput";
import { PageWrapper } from "../components/PageWrapper";
import { ImageGrid, ImageEmptyState } from "../components";

const Images = memo(function Images() {
  const { dockerAvailable, isConnected } = useApp();
  const {
    images,
    filters,
    allImages,
    handleSearch,
    imagesLoading,
    requestImages,
    handleRemoveImage,
  } = useImages();

  // Load images on component mount
  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestImages();
    }
  }, [isConnected, dockerAvailable, requestImages]);

  return (
    <PageWrapper>
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-100">Images</h1>
        <p className="mt-2 text-gray-400">
          Manage your Docker images - pull, remove, and view image details
        </p>
      </div>

      {allImages.length > 0 ? (
        <div className="space-y-6">
          <SearchInput
            value={filters.searchQuery}
            onChange={handleSearch}
            placeholder="Search images by name or ID..."
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
    </PageWrapper>
  );
});

export { Images };
