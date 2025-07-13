import { memo } from "react";

const About = memo(function About() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          About Docker Web GUI
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Learn more about this application
        </p>
      </div>
      <div className="space-y-4 text-gray-600 dark:text-gray-400">
        <p>
          Docker Web GUI is a modern web interface for managing Docker
          containers, images, networks, and volumes.
        </p>
        <p>
          Built with React, TypeScript, and Tailwind CSS, this application
          provides an intuitive and responsive interface for Docker management
          tasks.
        </p>
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Features
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Container management (start, stop, restart)</li>
            <li>Real-time container statistics and monitoring</li>
            <li>Interactive terminal access</li>
            <li>Container logs viewing</li>
            <li>Image management</li>
            <li>Network and volume management</li>
            <li>Dark/Light theme support</li>
            <li>Responsive design for mobile and desktop</li>
          </ul>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Version
          </h2>
          <p>Docker Web GUI v2.0</p>
        </div>
      </div>
    </div>
  );
});

export { About };
