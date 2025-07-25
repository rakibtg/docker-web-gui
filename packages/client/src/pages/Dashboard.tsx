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
    dockerAvailable,
    isConnected,
    dockerMessage,
    lastUpdate,
  } = useApp();

  // Get dashboard summary counts from backend
  const { summary } = useDashboardSummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="relative">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600">
              Dashboard
            </h1>
            <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>
          <p className="mt-4 text-lg text-gray-300 font-medium">
            Monitor and manage your Docker environment
          </p>
        </div>

        <div className="space-y-10">
          {/* System Overview */}
          <section className="relative">
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-white">
                  System Overview
                </h2>
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
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-white">
                  Resource Summary
                </h2>
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
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-green-400 to-green-600 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-white">
                  Recent Activity
                </h2>
              </div>
              <ActivityTimeline
                containers={containers}
                lastUpdate={lastUpdate}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
});

export { Dashboard };
