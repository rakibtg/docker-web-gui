import { API_BASE_URL, endpoints } from "./config";

export interface DockerImage {
  Id: string;
  Repository: string;
  Tag: string;
  Created: string;
  Size: string;
}

export const imageService = {
  async fetchImages(): Promise<DockerImage[]> {
    const response = await fetch(`${API_BASE_URL}${endpoints.images.fetch}`);
    if (!response.ok) throw new Error("Failed to fetch images");
    return response.json();
  },

  async executeCommand(imageId: string, command: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.images.command}?image=${imageId}&command=${command}`
    );
    if (!response.ok) throw new Error("Failed to execute command");
    return response.json();
  },
};
