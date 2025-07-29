import { memo } from "react";
import { useApp } from "../hooks/useApp";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

import {
  SystemOverview,
  ResourceSummary,
  ActivityTimeline,
} from "../components";

import { PageWrapper } from "../components/PageWrapper";

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
    <PageWrapper>
      {/* Header */}
      <div className="mb-6">
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
        <section>
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
        </section>

        <section>
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
        </section>

        <section>
          <ActivityTimeline containers={containers} lastUpdate={lastUpdate} />
        </section>
      </div>
    </PageWrapper>
  );
});

export { Dashboard };
