import { API_BASE_URL } from "./config";

export interface DockerVolume {
  Name: string;
  Driver: string;
  Mountpoint: string;
}

export const volumeService = {
  async fetchVolumes(): Promise<DockerVolume[]> {
    const response = await fetch(`${API_BASE_URL}/volumes`);
    if (!response.ok) throw new Error("Failed to fetch volumes");
    return response.json();
  },

  async createVolume(name: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/volumes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to create volume");
    return response.json();
  },

  async removeVolume(name: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/volumes/${name}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove volume");
    return response.json();
  },
};
