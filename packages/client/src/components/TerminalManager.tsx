import { Terminal } from "./Terminal";
import { FiX, FiTerminal } from "react-icons/fi";
import { IoNewspaper } from "react-icons/io5";
import { useApp } from "../hooks/useApp";

export function TerminalManager() {
  const {
    terminals,
    activeTerminalId,
    setActiveTerminalId,
    closeTerminal,
    websocket,
  } = useApp();

  if (terminals.length === 0) {
    return (
      <div className="flex-1 bg-gray-800 rounded-lg shadow-lg border-gray-600 border flex items-center justify-center">
        <div className="text-center text-gray-300">
          <FiTerminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Terminal Sessions</p>
          <p className="text-sm">
            Open a terminal from a running container to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800 border-gray-600 border-t flex flex-col">
      <div className="flex items-center bg-gray-700 px-2 py-1.5">
        <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminalId(terminal.id)}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTerminalId === terminal.id
                  ? "bg-gray-800 text-gray-100 border border-gray-600"
                  : "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
              }`}
            >
              {terminal.type === "logs" ? (
                <IoNewspaper className="w-4 h-4" />
              ) : (
                <FiTerminal className="w-4 h-4" />
              )}
              <span className="max-w-34 truncate">
                {terminal.type === "logs"
                  ? `Logs: ${terminal.containerName}`
                  : terminal.containerName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(terminal.id);
                }}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Close terminal"
                aria-label="Close terminal"
              >
                <FiX className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Active Terminal */}
      <div className="flex-1 relative">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className={`absolute inset-0 ${
              activeTerminalId === terminal.id ? "block" : "hidden"
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
                <p>No terminal connection</p>
              </div>
            )}
          </div>
        ))}
        {terminals.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-300">
            <p>No active terminal session</p>
          </div>
        )}
      </div>
    </div>
  );
}
