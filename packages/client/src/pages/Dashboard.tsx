import { memo } from "react";
import { useApp } from "../hooks/useApp";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

import {
  SystemOverview,
  ResourceSummary,
  ActivityTimeline,
} from "../components";

const Dashboard = memo(function Dashboard() {
  const {
    containers,
    lastUpdate,
    isConnected,
    dockerMessage,
    dockerAvailable,
  } = useApp();

  const { summary } = useDashboardSummary();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="relative">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-300">
              Dashboard
            </h2>
          </div>
          <p className="text-sm text-gray-300 font-medium">
            Monitor and manage your Docker environment
          </p>
        </div>

        <div className="space-y-6">
          {/* System Overview */}
          <section className="relative">
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded py-4 px-5 shadow-2xl">
              <div className="flex items-center mb-4">
                <h3 className="font-semibold text-gray-100 flex items-center space-x-2">
                  <span>System Overview</span>
                </h3>
              </div>
              <SystemOverview
                dockerAvailable={dockerAvailable}
                isConnected={isConnected}
                dockerMessage={dockerMessage}
              />
            </div>
          </section>

          {/* Resource Summary */}
          <section className="relative">
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded py-4 px-5 shadow-2xl">
              <div className="flex items-center mb-4">
                <h3 className="font-semibold text-gray-100 flex items-center space-x-2">
                  <span>Resource Summary</span>
                </h3>
              </div>
              <ResourceSummary
                containerCount={summary.containers}
                imageCount={summary.images}
                networkCount={summary.networks}
                volumeCount={summary.volumes}
              />
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="relative">
            <ActivityTimeline containers={containers} lastUpdate={lastUpdate} />
          </section>
        </div>
      </div>
    </div>
  );
});

export { Dashboard };
