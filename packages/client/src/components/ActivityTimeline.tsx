import { memo } from "react";
import { FaDocker, FaPlay, FaStop, FaClock } from "react-icons/fa";
import type { ContainerWithStats } from "../types";

interface ActivityTimelineProps {
  containers: ContainerWithStats[];
  lastUpdate: string;
}

interface ActivityItem {
  id: string;
  type: "container_start" | "container_stop" | "container_create" | "general";
  message: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export const ActivityTimeline = memo(function ActivityTimeline({
  containers,
  lastUpdate,
}: ActivityTimelineProps) {
  // Generate mock activities based on container states
  const generateActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Add container-based activities
    containers.slice(0, 5).forEach((container, index) => {
      const timestamp = new Date(now.getTime() - (index + 1) * 60000); // Mock timestamps

      if (container.state === "running") {
        activities.push({
          id: `${container.id}_running`,
          type: "container_start",
          message: `Container "${container.name}" is running`,
          timestamp: timestamp.toLocaleTimeString(),
          icon: <FaPlay className="w-3 h-3" />,
          color: "text-green-400",
        });
      } else if (container.state === "exited") {
        activities.push({
          id: `${container.id}_stopped`,
          type: "container_stop",
          message: `Container "${container.name}" stopped`,
          timestamp: timestamp.toLocaleTimeString(),
          icon: <FaStop className="w-3 h-3" />,
          color: "text-red-400",
        });
      }
    });

    // Add general activity
    if (lastUpdate) {
      activities.push({
        id: "last_update",
        type: "general",
        message: "System data refreshed",
        timestamp: new Date(lastUpdate).toLocaleTimeString(),
        icon: <FaClock className="w-3 h-3" />,
        color: "text-blue-400",
      });
    }

    return activities
      .sort(
        (a, b) =>
          new Date(`1970/01/01 ${b.timestamp}`).getTime() -
          new Date(`1970/01/01 ${a.timestamp}`).getTime()
      )
      .slice(0, 6);
  };

  const activities = generateActivities();

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-6 flex items-center space-x-2">
        <FaDocker className="text-blue-500" />
        <span>Recent Activity</span>
      </h3>

      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full bg-gray-700 ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.timestamp}
                </p>
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-[1.125rem] mt-10 w-px h-6 bg-gray-600" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FaClock className="mx-auto w-8 h-8 text-gray-600 mb-3" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
});
