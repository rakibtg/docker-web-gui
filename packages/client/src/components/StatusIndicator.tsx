import { MdCheckCircle, MdError, MdWarning, MdCircle } from "react-icons/md";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "available" | "unavailable";
  label: string;
  title?: string;
}

export function StatusIndicator({
  status,
  label,
  title,
}: StatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "connected":
      case "available":
        return <MdCheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected":
        return <MdError className="w-4 h-4 text-red-500" />;
      case "unavailable":
        return <MdWarning className="w-4 h-4 text-orange-500" />;
      default:
        return <MdCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2" title={title || label}>
      {getStatusIcon()}
      <span className="text-sm text-theme-secondary transition-colors">
        {label}
      </span>
    </div>
  );
}
