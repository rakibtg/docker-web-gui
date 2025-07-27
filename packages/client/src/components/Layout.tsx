import { memo } from "react";
import { useApp } from "../hooks/useApp";
import { TerminalManager } from "./TerminalManager";

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
 * - Terminals stay alive when hidden (no DOM removal)
 */
export const Layout = memo<LayoutProps>(function Layout({ children }) {
  const { showTerminals, terminals } = useApp();

  // Only show terminal space if there are terminals and they should be visible
  const shouldShowTerminalSpace = showTerminals && terminals.length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main content area - scrollable when terminals are shown */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-auto
          ${
            shouldShowTerminalSpace
              ? "h-1/2 md:h-1/2" // 50% height on all screen sizes when terminals shown
              : "flex-1" // Full height when terminals hidden
          }
        `}
      >
        {children}
      </div>

      {/* Terminal panel - always rendered but hidden when not needed */}
      <div
        className={`
          transition-all duration-300 ease-in-out border-t border-gray-600
          ${
            shouldShowTerminalSpace
              ? "h-1/2 md:h-1/2 opacity-100"
              : "h-0 opacity-0 overflow-hidden"
          }
        `}
      >
        {/* Always render TerminalManager to keep sessions alive */}
        <TerminalManager />
      </div>
    </div>
  );
});
