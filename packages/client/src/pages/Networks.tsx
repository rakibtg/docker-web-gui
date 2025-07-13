import { memo } from "react";

const Networks = memo(function Networks() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Networks
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage Docker networks and their configurations
        </p>
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Docker networks management page. This will show all Docker networks and
        their configurations.
      </div>
    </div>
  );
});

export { Networks };
