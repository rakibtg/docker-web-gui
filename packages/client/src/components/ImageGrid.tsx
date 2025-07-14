import { memo } from "react";
import { ImageCard } from "./ImageCard";
import type { DockerImage } from "../types";

interface ImageGridProps {
  images: DockerImage[];
  onImageRemove?: (imageId: string, force?: boolean) => void;
}

const ImageGrid = memo(function ImageGrid({
  images,
  onImageRemove,
}: ImageGridProps) {
  return (
    <div className="space-y-2">
      {images.map((image) => (
        <ImageCard key={image.imageId} image={image} onRemove={onImageRemove} />
      ))}
    </div>
  );
});

export { ImageGrid };
