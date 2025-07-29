import { memo } from "react";
import { NetworkCard } from "./NetworkCard";
import type { DockerNetwork } from "../types";

interface NetworkGridProps {
  networks: DockerNetwork[];
}

const NetworkGrid = memo(function NetworkGrid({ networks }: NetworkGridProps) {
  return (
    <div className="space-y-2">
      {networks.map((network) => (
        <NetworkCard key={network.id} network={network} />
      ))}
    </div>
  );
});

export { NetworkGrid };
