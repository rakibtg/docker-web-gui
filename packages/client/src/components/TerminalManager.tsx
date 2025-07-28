import { useCallback, useRef, useEffect, useState } from "react";
import { Terminal } from "./Terminal";
import { useApp } from "../hooks/useApp";
import { IoNewspaper } from "react-icons/io5";
import { FiX, FiTerminal, FiMinimize2 } from "react-icons/fi";

// Custom hook to calculate available width for tabs container
function useTabsContainerWidth(terminalsCount: number) {
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabsWidth, setTabsWidth] = useState<number | null>(null);

  const calculateWidth = useCallback(() => {
    if (!headerRef.current || !tabsContainerRef.current) return;

    const headerElement = headerRef.current;
    const headerWidth = headerElement.offsetWidth;

    // Calculate space taken by minimize button (approx 44px including margins)
    const minimizeButtonWidth = 44;

    // Calculate space taken by padding/margins on header (px-2 = 16px)
    const headerPadding = 16;

    // Calculate available width for tabs
    const availableWidth = headerWidth - minimizeButtonWidth - headerPadding;

    const newWidth = Math.max(availableWidth, 200); // Minimum width of 200px

    // Debug logging to track width changes
    console.log("TerminalManager width calculation:", {
      headerWidth,
      availableWidth,
      newWidth,
      timestamp: new Date().toISOString(),
    });

    setTabsWidth(newWidth);
  }, []);

  useEffect(() => {
    calculateWidth();

    // Recalculate on window resize
    const handleResize = () => {
      calculateWidth();
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to detect layout changes (like sidebar collapse)
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    if (headerRef.current) {
      // Watch for size changes on the header element
      resizeObserver = new ResizeObserver(() => {
        // Use setTimeout to avoid infinite loops and debounce
        setTimeout(calculateWidth, 50);
      });
      resizeObserver.observe(headerRef.current);

      // Find and observe the sidebar element
      const sidebarElement = document.querySelector("aside");
      if (sidebarElement) {
        resizeObserver.observe(sidebarElement);
      }

      // Find and observe the main content area
      const mainContentElement = document.querySelector("div.flex-grow");
      if (mainContentElement) {
        resizeObserver.observe(mainContentElement);
      }

      // Also watch for transitions on the sidebar that might indicate collapse/expand
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "class"
          ) {
            const target = mutation.target as Element;
            // Check if the changed element is related to sidebar width
            if (
              target.classList.contains("w-16") ||
              target.classList.contains("w-64") ||
              target.closest("aside") ||
              target.tagName === "ASIDE"
            ) {
              setTimeout(calculateWidth, 100);
            }
          }
        });
      });

      // Watch for class changes on the sidebar element specifically
      if (sidebarElement) {
        mutationObserver.observe(sidebarElement, {
          attributes: true,
          attributeFilter: ["class"],
          subtree: true,
        });
      }
    }

    // Also recalculate when terminals count changes (in case of layout changes)
    const timeoutId = setTimeout(calculateWidth, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      clearTimeout(timeoutId);
    };
  }, [calculateWidth, terminalsCount]);

  return { headerRef, tabsContainerRef, tabsWidth };
}

export function TerminalManager() {
  const {
    terminals,
    websocket,
    closeTerminal,
    setShowTerminals,
    activeTerminalId,
    setActiveTerminalId,
  } = useApp();

  const { headerRef, tabsContainerRef, tabsWidth } = useTabsContainerWidth(
    terminals.length
  );

  // Auto-scroll to the right when new terminals are added
  useEffect(() => {
    if (tabsContainerRef.current && terminals.length > 0) {
      // Use setTimeout to ensure the DOM has updated with the new terminal tab
      setTimeout(() => {
        if (tabsContainerRef.current) {
          tabsContainerRef.current.scrollLeft =
            tabsContainerRef.current.scrollWidth;
        }
      }, 50);
    }
  }, [terminals.length, tabsContainerRef]);

  const handleToggleVisibility = useCallback(() => {
    setShowTerminals(false);
  }, [setShowTerminals]);

  if (terminals.length === 0) {
    return (
      <div className="flex-1 bg-gray-800 rounded-lg shadow-lg border-gray-600 border flex items-center justify-center">
        <div className="text-center text-gray-300">
          <FiTerminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Terminal Sessions</p>
          <p className="text-sm mb-4">
            Open a terminal from a running container to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800 border-gray-600 border-t flex flex-col relative">
      {/* Terminal tabs header */}
      <div
        ref={headerRef}
        className="flex items-center bg-gray-700 px-2 py-1.5 min-h-[44px] pr-10"
      >
        {/* tabs container */}
        <div
          ref={tabsContainerRef}
          className="flex items-center space-x-1 flex-1 overflow-x-auto"
          style={{
            maxWidth: tabsWidth ? `${tabsWidth}px` : "auto",
          }}
        >
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminalId(terminal.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTerminalId === terminal.id
                  ? "bg-gray-800 text-gray-100 border border-gray-600 shadow-sm"
                  : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
              }`}
              title={`${terminal.type === "logs" ? "Logs" : "Terminal"}: ${
                terminal.containerName
              }`}
            >
              {terminal.type === "logs" ? (
                <IoNewspaper className="w-4 h-4" />
              ) : (
                <FiTerminal className="w-4 h-4" />
              )}
              <span className="max-w-32 truncate">
                {terminal.type === "logs"
                  ? `Logs: ${terminal.containerName}`
                  : terminal.containerName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(terminal.id);
                }}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                title="Close terminal"
                aria-label="Close terminal"
              >
                <FiX className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>

        {/* Minimize button */}
        <button
          onClick={handleToggleVisibility}
          className={`
            ml-2 text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded hover:bg-gray-600  
            absolute right-0 mr-1.5
          `}
          title="Minimize terminals"
          aria-label="Minimize terminals"
        >
          <FiMinimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Active Terminal Content */}
      <div className="flex-1 relative bg-gray-900">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`absolute inset-0 transition-opacity duration-200 ${
              activeTerminalId === terminal.id
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {websocket ? (
              <Terminal
                terminalId={terminal.id}
                containerId={terminal.containerId}
                containerName={terminal.containerName}
                websocket={websocket}
                sessionType={terminal.type}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <div className="text-center">
                  <FiTerminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No WebSocket connection</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
