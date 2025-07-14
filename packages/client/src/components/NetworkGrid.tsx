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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
