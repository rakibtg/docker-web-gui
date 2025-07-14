import type { DockerImage } from "../types";

export interface ImageFilters {
  searchQuery: string;
}

export function filterImages(
  images: DockerImage[],
  filters: ImageFilters
): DockerImage[] {
  return images.filter((image) => {
    const { searchQuery } = filters;

    // If no search query, show all images
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();

    // Search in repository name
    if (image.repository.toLowerCase().includes(query)) {
      return true;
    }

    // Search in tag
    if (image.tag.toLowerCase().includes(query)) {
      return true;
    }

    // Search in image ID
    if (image.imageId.toLowerCase().includes(query)) {
      return true;
    }

    // Search in combined repository:tag
    if (image.id.toLowerCase().includes(query)) {
      return true;
    }

    // Search in size
    if (image.size.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  });
}
