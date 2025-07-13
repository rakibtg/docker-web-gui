import { memo } from "react";

const Volumes = memo(function Volumes() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Volumes
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage Docker volumes and their usage
        </p>
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Docker volumes management page. This will show all Docker volumes and
        their usage.
      </div>
    </div>
  );
});

export { Volumes };
