import { memo } from "react";
import { FiBox } from "react-icons/fi";
import { LuLayers3 } from "react-icons/lu";
import { HiGlobeAlt, HiDatabase } from "react-icons/hi";

interface ResourceSummaryProps {
  imageCount: number;
  volumeCount: number;
  networkCount: number;
  containerCount: number;
}

const SummaryCard = ({
  icon,
  title,
  value,
  actions,
  subtitle,
  color = "blue",
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  value: string | number;
  actions?: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-400/10",
      border: "border-blue-500/30",
      icon: "bg-blue-500/20 text-blue-400",
      accent: "bg-blue-500",
    },
    green: {
      bg: "bg-gradient-to-br from-green-500/10 via-green-600/5 to-emerald-400/10",
      border: "border-green-500/30",
      icon: "bg-green-500/20 text-green-400",
      accent: "bg-green-500",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-500/10 via-amber-600/5 to-yellow-400/10",
      border: "border-yellow-500/30",
      icon: "bg-yellow-500/20 text-yellow-400",
      accent: "bg-yellow-500",
    },
    red: {
      bg: "bg-gradient-to-br from-red-500/10 via-red-600/5 to-rose-400/10",
      border: "border-red-500/30",
      icon: "bg-red-500/20 text-red-400",
      accent: "bg-red-500",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500/10 via-violet-600/5 to-purple-400/10",
      border: "border-purple-500/30",
      icon: "bg-purple-500/20 text-purple-400",
      accent: "bg-purple-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`relative group border rounded-sm ${colors.border} ${colors.bg} p-6 hover:shadow-xl hover:shadow-${color}-500/10 overflow-hidden`}
    >
      <div
        className={`absolute -inset-0.5 ${colors.bg} rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300`}
      ></div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-sm ${colors.icon} shadow-lg`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                {title}
              </h3>
              <div className="text-3xl font-bold text-white mt-1 font-mono">
                {value}
              </div>
              {subtitle && (
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export const ResourceSummary = memo(function ResourceSummary({
  imageCount,
  volumeCount,
  networkCount,
  containerCount,
}: ResourceSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Containers Summary */}
      <SummaryCard
        title="Containers"
        icon={<FiBox className="w-6 h-6" />}
        value={containerCount}
        subtitle="Total containers"
        color="blue"
      />

      {/* Images Summary */}
      <SummaryCard
        title="Images"
        icon={<LuLayers3 className="w-6 h-6" />}
        value={imageCount}
        subtitle="Total images"
        color="green"
      />

      {/* Networks Summary */}
      <SummaryCard
        title="Networks"
        icon={<HiGlobeAlt className="w-6 h-6" />}
        value={networkCount}
        subtitle="Total networks"
        color="purple"
      />

      {/* Volumes Summary */}
      <SummaryCard
        title="Volumes"
        icon={<HiDatabase className="w-6 h-6" />}
        value={volumeCount}
        subtitle="Total volumes"
        color="yellow"
      />
    </div>
  );
});
