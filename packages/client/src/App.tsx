import { useCallback } from "react";

import { ContainerGrid, EmptyState, TerminalManager } from "./components";

import { useApp } from "./hooks/useApp";
import { AppProvider } from "./contexts/AppContext";
import Sidebar from "./components/Sidebar";

function AppContent() {
  const {
    containers,
    isConnected,
    dockerAvailable,
    dockerMessage,
    loading,
    error,
    showTerminals,
    requestContainers,
    handleContainerToggle,
    handleContainerRestart,
    addTerminal,
    addLogs,
  } = useApp();

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      addTerminal(containerId, containerName);
    },
    [addTerminal]
  );

  const handleOpenLogs = useCallback(
    (containerId: string, containerName: string) => {
      addLogs(containerId, containerName);
    },
    [addLogs]
  );

  return (
    <div className="min-h-screen bg-theme-primary transition-colors flex">
      <Sidebar />
      <div className="flex-grow shrink-0 overflow-hidden">
        <div
          className={`flex flex-col ${
            showTerminals && "h-1/2"
          } overflow-auto mb-3 p-6 lg:p-6 pt-16 lg:pt-6`}
        >
          <div className={`grid gap-6 grid-cols-1 transition-all duration-300`}>
            <main className="space-y-6">
              {containers.length > 0 ? (
                <ContainerGrid
                  containers={containers}
                  onContainerToggle={handleContainerToggle}
                  onContainerRestart={handleContainerRestart}
                  onOpenTerminal={handleOpenTerminal}
                  onOpenLogs={handleOpenLogs}
                />
              ) : (
                <EmptyState
                  dockerAvailable={dockerAvailable}
                  isConnected={isConnected}
                  loading={loading}
                  onLoadContainers={requestContainers}
                />
              )}
            </main>
          </div>
        </div>

        {showTerminals && (
          <div className="h-1/2">
            <TerminalManager />
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
