import { memo } from "react";
import { useApp } from "../hooks/useApp";
import {
  SystemOverview,
  ResourceSummary,
  LiveStatistics,
  ActivityTimeline,
} from "../components";

const Dashboard = memo(function Dashboard() {
  const {
    containers,
    images,
    networks,
    volumes,
    dockerAvailable,
    isConnected,
    dockerMessage,
    isStatsStreaming,
    lastUpdate,
    handleContainerToggle,
    handleVolumesPrune,
    startStatsStreaming,
    stopStatsStreaming,
  } = useApp();

  const handleImagesPrune = () => {
    // TODO: Implement images pruning in the backend/context
    console.log("Images pruning not yet implemented");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Monitor and manage your Docker environment
        </p>
      </div>

      {/* System Overview */}
      <section>
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          System Overview
        </h2>
        <SystemOverview
          dockerAvailable={dockerAvailable}
          isConnected={isConnected}
          dockerMessage={dockerMessage}
        />
      </section>

      {/* Resource Summary */}
      <section>
        <h2 className="text-xl font-semibold text-gray-100 mb-6">
          Resource Summary
        </h2>
        <ResourceSummary
          containers={containers}
          images={images}
          networks={networks}
          volumes={volumes}
          onContainerToggle={handleContainerToggle}
          onImagesPrune={handleImagesPrune}
          onVolumesPrune={handleVolumesPrune}
        />
      </section>

      {/* Bottom Section: Statistics and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Statistics - Takes 2 columns */}
        <div className="lg:col-span-2">
          <LiveStatistics
            containers={containers}
            isStatsStreaming={isStatsStreaming}
            onStartStatsStreaming={startStatsStreaming}
            onStopStatsStreaming={stopStatsStreaming}
          />
        </div>

        {/* Activity Timeline - Takes 1 column */}
        <div className="lg:col-span-1">
          <ActivityTimeline containers={containers} lastUpdate={lastUpdate} />
        </div>
      </div>
    </div>
  );
});

export { Dashboard };
