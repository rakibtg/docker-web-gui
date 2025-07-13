import { memo } from "react";

const Images = memo(function Images() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Images
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your Docker images
        </p>
      </div>
      <div className="text-gray-600 dark:text-gray-400">
        Docker images management page. This will show all available Docker
        images.
      </div>
    </div>
  );
});

export { Images };
