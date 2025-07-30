import { memo, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import { MdRefresh } from "react-icons/md";
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

  useEffect(() => {
    if (isConnected && dockerAvailable) {
      requestImages();
    }
  }, [isConnected, dockerAvailable, requestImages]);

  return (
    <PageWrapper>
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
            Images
          </h2>
          <button
            title="Refresh Images"
            onClick={requestImages}
            className="h-7 w-7 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:cursor-pointer transition-colors flex justify-center items-center"
          >
            <MdRefresh className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <SearchInput
            value={filters.searchQuery}
            onChange={handleSearch}
            placeholder="Search images by name or ID..."
          />
        </div>
      </div>

      {allImages.length > 0 ? (
        <div className="space-y-6">
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
