import { memo } from "react";

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  loading?: boolean;
  className?: string;
}

const ToggleSwitch = memo(function ToggleSwitch({
  isOn,
  onToggle,
  disabled = false,
  size = "md",
  label,
  loading = false,
  className = "",
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: {
      container: "w-8 h-4",
      toggle: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      container: "w-10 h-5",
      toggle: "w-4 h-4",
      translate: "translate-x-5",
    },
    lg: {
      container: "w-12 h-6",
      toggle: "w-5 h-5",
      translate: "translate-x-6",
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-3 text-sm font-medium text-gray-700">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isOn ? "true" : "false"}
        disabled={disabled || loading}
        onClick={onToggle}
        className={`
          relative inline-flex ${
            sizeClass.container
          } flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isOn
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-200 hover:bg-gray-300"
          }
        `}
      >
        <span className="sr-only">
          {isOn ? "Turn off" : "Turn on"}
          {label && ` ${label}`}
        </span>
        <span
          aria-hidden="true"
          className={`
            ${
              sizeClass.toggle
            } inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isOn ? sizeClass.translate : "translate-x-0"}
            ${loading ? "animate-pulse" : ""}
          `}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </span>
      </button>
    </div>
  );
});

export { ToggleSwitch };
