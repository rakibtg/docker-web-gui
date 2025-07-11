import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  duration?: number; // in seconds, 0 means no auto-hide
  debounceDelay?: number; // in milliseconds for hide debounce
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = "right",
  disabled = false,
  duration = 0, // 0 means hover behavior (show/hide on mouse enter/leave)
  debounceDelay = 100, // 100ms debounce for smoother UX
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideTooltip = () => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const debouncedHideTooltip = useDebounce(hideTooltip, debounceDelay);

  const showTooltip = () => {
    debouncedHideTooltip.cancel();
    setIsVisible(true);

    if (duration > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, duration * 1000);
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    showTooltip();
  };

  const handleMouseLeave = () => {
    debouncedHideTooltip();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      debouncedHideTooltip.cancel();
    };
  }, [debouncedHideTooltip]);

  if (!content || disabled) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
      default:
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-100";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-100";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-100";
      case "right":
      default:
        return "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-100";
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-md shadow-lg whitespace-nowrap ${getPositionClasses()}`}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}
