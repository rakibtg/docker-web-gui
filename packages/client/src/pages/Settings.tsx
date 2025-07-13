import { memo } from "react";

const Settings = memo(function Settings() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure your Docker Web GUI preferences
        </p>
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Application settings and configuration options.
      </div>
    </div>
  );
});

export { Settings };
