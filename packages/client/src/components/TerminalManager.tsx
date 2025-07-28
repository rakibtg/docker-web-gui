import { Terminal } from "./Terminal";
import { useApp } from "../hooks/useApp";
import { IoNewspaper } from "react-icons/io5";
import { useCallback, useEffect } from "react";
import { FiX, FiTerminal, FiMinimize2 } from "react-icons/fi";
import { useTabsContainerWidth } from "../contexts/useTerminalManagement";

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
            <div
              key={terminal.id}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeTerminalId === terminal.id
                  ? "bg-gray-800 text-gray-100 border border-gray-600 shadow-sm"
                  : "text-gray-300 hover:text-gray-100 hover:bg-gray-600"
              }`}
              title={`${terminal.type === "logs" ? "Logs" : "Terminal"}: ${
                terminal.containerName
              }`}
            >
              <button
                onClick={() => setActiveTerminalId(terminal.id)}
                className="flex items-center space-x-1 flex-1"
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
              </button>
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
            </div>
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
