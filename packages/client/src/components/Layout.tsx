import { memo } from "react";
import { TerminalManager } from "./TerminalManager";
import { useApp } from "../hooks/useApp";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that provides a persistent terminal section
 * The terminal panel takes 50% of the screen height when shown
 * and the main content area is scrollable in the remaining space
 *
 * Features:
 * - Responsive design (mobile-friendly)
 * - Smooth transitions
 * - Persistent terminals across routes
 * - Optimized scrolling behavior
 */
export const Layout = memo<LayoutProps>(function Layout({ children }) {
  const { showTerminals } = useApp();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main content area - scrollable when terminals are shown */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-auto
          ${
            showTerminals
              ? "h-1/2 md:h-1/2" // 50% height on all screen sizes when terminals shown
              : "flex-1" // Full height when terminals hidden
          }
        `}
      >
        {children}
      </div>

      {/* Terminal panel - persistent across routes */}
      {showTerminals && (
        <div
          className={`
            transition-all duration-300 ease-in-out border-t border-gray-600
            h-1/2 md:h-1/2
            ${showTerminals ? "opacity-100" : "opacity-0"}
          `}
        >
          <TerminalManager />
        </div>
      )}
    </div>
  );
});
