import { useCallback } from "react";

import {
  Header,
  ContainerTable,
  ContainerGrid,
  EmptyState,
  TerminalManager,
} from "./components";

import { useApp } from "./hooks/useApp";
import { AppProvider } from "./contexts/AppContext";

function AppContent() {
  const {
    containers,
    isConnected,
    dockerAvailable,
    dockerMessage,
    loading,
    error,
    viewMode,
    showTerminals,
    requestContainers,
    handleContainerToggle,
    addTerminal,
  } = useApp();

  const handleOpenTerminal = useCallback(
    (containerId: string, containerName: string) => {
      addTerminal(containerId, containerName);
    },
    [addTerminal]
  );

  return (
    <div className="min-h-screen bg-theme-primary p-4 transition-colors">
      <div className="max-w-5/6 mx-auto">
        <div>
          <Header />
        </div>

        <div
          className={`flex flex-col ${
            showTerminals && "h-[calc(100vh-56.5vh)]"
          } overflow-auto mb-3`}
        >
          <div className={`grid gap-6 grid-cols-1 transition-all duration-300`}>
            <main className="space-y-6">
              {containers.length > 0 ? (
                viewMode === "table" ? (
                  <ContainerTable
                    containers={containers}
                    onContainerToggle={handleContainerToggle}
                    onOpenTerminal={handleOpenTerminal}
                  />
                ) : (
                  <ContainerGrid
                    containers={containers}
                    onContainerToggle={handleContainerToggle}
                    onOpenTerminal={handleOpenTerminal}
                  />
                )
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
          <div className="h-[500px]">
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
