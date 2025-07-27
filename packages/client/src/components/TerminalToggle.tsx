import { memo } from "react";
import { useApp } from "../hooks/useApp";
import { BsFillTerminalFill } from "react-icons/bs";

/**
 * Global Terminal Toggle Component
 * Provides a floating action button to toggle terminal visibility
 * and manage terminal sessions from anywhere in the app
 */
export const TerminalToggle = memo(function TerminalToggle() {
  const { showTerminals, terminals, setShowTerminals } = useApp();

  const hasTerminals = terminals.length > 0;

  const handleToggle = () => {
    setShowTerminals(!showTerminals);
  };

  if (!hasTerminals) {
    return null;
  }

  if (showTerminals) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 relative">
        <button
          onClick={handleToggle}
          className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors border border-gray-600"
          title={showTerminals ? "Hide terminals" : "Show terminals"}
          aria-label={showTerminals ? "Hide terminals" : "Show terminals"}
        >
          <BsFillTerminalFill className="w-5 h-5" />
          {hasTerminals && (
            <div className="bg-red-600 text-white w-4 h-4 flex items-center justify-center text-xs rounded-full absolute top-0 right-0">
              {terminals.length}
            </div>
          )}
        </button>
      </div>
    </div>
  );
});
