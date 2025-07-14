export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  imageId: string;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  created: string;
  ipam: {
    driver: string;
    config: Array<{
      subnet?: string;
      gateway?: string;
    }>;
  };
  containers: Array<{
    name: string;
    id: string;
    ipv4Address?: string;
    ipv6Address?: string;
  }>;
  options: Record<string, string>;
  labels: Record<string, string>;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  configFrom?: {
    network: string;
  };
}

export interface DockerStats {
  id: string;
  name: string;
  cpuPerc: string;
  memUsage: string;
  memPerc: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

export interface ContainerWithStats extends DockerContainer {
  stats?: DockerStats;
}

export interface ServerMessage {
  type: string;
  data?: DockerContainer[] | ContainerWithStats | unknown;
  message?: string;
  available?: boolean;
  timestamp?: string;
  error?: string;
  clientId?: string;
}
