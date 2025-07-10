export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
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
