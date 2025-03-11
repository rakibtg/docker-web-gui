import { API_BASE_URL, endpoints } from "./config";

export interface Container {
  Id: string;
  Name: string;
  Image: string;
  State: string;
  Status: string;
  Created: string;
  Ports: string[];
}

export const containerService = {
  async fetchContainers(
    status: "active" | "all" | "stopped" = "all"
  ): Promise<Container[]> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.containers.fetch}?status=${status}`
    );
    if (!response.ok) throw new Error("Failed to fetch containers");
    return response.json();
  },

  async fetchContainerById(containerId: string): Promise<Container> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.containers.fetchById}?container=${containerId}`
    );
    if (!response.ok) throw new Error("Failed to fetch container");
    return response.json();
  },

  async executeCommand(containerId: string, command: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.containers.command}?container=${containerId}&command=${command}`
    );
    if (!response.ok) throw new Error("Failed to execute command");
    return response.json();
  },

  async fetchLogs(containerId: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.containers.logs}?container=${containerId}`
    );
    if (!response.ok) throw new Error("Failed to fetch logs");
    return response.json();
  },

  async fetchStats(): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.containers.stats}`
    );
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },
};
