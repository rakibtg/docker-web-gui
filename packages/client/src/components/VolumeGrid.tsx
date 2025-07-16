import { memo } from "react";
import type { DockerVolume } from "../types";
import { VolumeCard } from "./VolumeCard";

interface VolumeGridProps {
  volumes: DockerVolume[];
}

const VolumeGrid = memo(function VolumeGrid({ volumes }: VolumeGridProps) {
  return (
    <div className="space-y-2">
      {volumes.map((volume) => (
        <VolumeCard key={volume.name} volume={volume} />
      ))}
    </div>
  );
});

export { VolumeGrid };
