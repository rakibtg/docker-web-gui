import { memo } from "react";
import { NetworkCard } from "./NetworkCard";
import type { DockerNetwork, DockerContainer } from "../types";

interface NetworkGridProps {
  networks: DockerNetwork[];
  containers: DockerContainer[];
}

const NetworkGrid = memo(function NetworkGrid({
  networks,
  containers,
}: NetworkGridProps) {
  return (
    <div className="space-y-2">
      {networks.map((network) => (
        <NetworkCard
          key={network.id}
          network={network}
          containers={containers}
        />
      ))}
    </div>
  );
});

export { NetworkGrid };
