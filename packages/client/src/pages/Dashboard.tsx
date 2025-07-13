import { memo } from "react";

const Dashboard = memo(function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of your Docker environment
        </p>
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Welcome to the Docker Web GUI Dashboard. This page will contain overview
        information and statistics.
      </div>
    </div>
  );
});

export { Dashboard };
