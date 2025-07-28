import { useApp } from "../hooks/useApp";
import { TerminalManager } from "./TerminalManager";
import { memo, useEffect, useRef, useState, useCallback } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = memo<LayoutProps>(function Layout({ children }) {
  const { showTerminals, terminals } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [terminalHeight, setTerminalHeight] = useState<number>(0);

  // Only show terminal space if there are terminals and they should be visible
  const shouldShowTerminalSpace = showTerminals && terminals.length > 0;

  const calculateHeights = useCallback(() => {
    if (!containerRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;

    if (shouldShowTerminalSpace) {
      // Split 50/50 when terminals are shown
      const halfHeight = Math.floor(containerHeight / 2);
      setContentHeight(halfHeight);
      setTerminalHeight(containerHeight - halfHeight); // Use remaining space to avoid gaps
    } else {
      // Full height for content when no terminals
      setContentHeight(containerHeight);
      setTerminalHeight(0);
    }
  }, [shouldShowTerminalSpace]);

  // Calculate heights on mount and when dependencies change
  useEffect(() => {
    calculateHeights();
  }, [calculateHeights]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Use requestAnimationFrame to avoid excessive calculations during resize
      requestAnimationFrame(calculateHeights);
    };

    window.addEventListener("resize", handleResize);

    // Also recalculate when the container size might change due to other factors
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateHeights);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [calculateHeights]);

  return (
    <div ref={containerRef} className="h-screen flex flex-col overflow-hidden">
      {/* Main content area - scrollable when terminals are shown */}
      <div
        className="transition-all duration-300 ease-in-out overflow-auto mb-2"
        style={{
          height: contentHeight > 0 ? `${contentHeight}px` : "100%",
        }}
      >
        {children}
      </div>

      {/* Terminal panel - always rendered but hidden when not needed */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${
            shouldShowTerminalSpace
              ? "opacity-100 border-t border-gray-600"
              : "opacity-0 overflow-hidden"
          }
        `}
        style={{
          height: `${terminalHeight}px`,
        }}
      >
        {/* Always render TerminalManager to keep sessions alive */}
        <TerminalManager />
      </div>
    </div>
  );
});
