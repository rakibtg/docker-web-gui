// Docker interface definitions
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

export interface DockerContainerDetails extends DockerContainer {
  command?: string;
  labels?: Record<string, string>;
  env?: string[];
  mounts?: Array<{
    type: string;
    source: string;
    destination: string;
    mode: string;
    name?: string;
  }>;
  networks?: Array<{
    name: string;
    networkId: string;
    ipAddress?: string;
    gateway?: string;
    macAddress?: string;
  }>;
  restartPolicy?: {
    name: string;
    maximumRetryCount?: number;
  };
  privileged?: boolean;
  workingDir?: string;
  user?: string;
  hostname?: string;
  platform?: string;
  architecture?: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
  imageId: string;
}

export interface DockerImageDetails extends DockerImage {
  architecture?: string;
  os?: string;
  labels?: Record<string, string>;
  env?: string[];
  cmd?: string[];
  entrypoint?: string[];
  exposedPorts?: string[];
  workingDir?: string;
  user?: string;
  virtualSize?: string;
  parent?: string;
  config?: {
    hostname?: string;
    domainname?: string;
    user?: string;
    attachStdin?: boolean;
    attachStdout?: boolean;
    attachStderr?: boolean;
    tty?: boolean;
    openStdin?: boolean;
    stdinOnce?: boolean;
    env?: string[];
    cmd?: string[];
    image?: string;
    volumes?: Record<string, unknown>;
    workingDir?: string;
    entrypoint?: string[];
    networkDisabled?: boolean;
    macAddress?: string;
    onBuild?: string[];
    labels?: Record<string, string>;
    shell?: string[];
  };
  rootFS?: {
    type: string;
    layers?: string[];
  };
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

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  labels: Record<string, string>;
  options: Record<string, string>;
  scope: string;
  size?: string;
  usedBy?: Array<{
    containerId: string;
    containerName: string;
    mountPath: string;
  }>;
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

export interface DockerOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface DockerAvailabilityResult {
  available: boolean;
  message?: string;
}

export interface VolumesPruneResult {
  deletedVolumes: string[];
  reclaimedSpace: string;
}
