import { useCallback } from "react";

import {
  ContainerTable,
  ContainerGrid,
  EmptyState,
  TerminalManager,
} from "./components";

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
    <div className="min-h-screen bg-theme-primary transition-colors flex">
      <Sidebar />
      <div className="flex-grow shrink-0 overflow-hidden">
        {/* <div className="border border-amber-300">
          <Header />
        </div> */}

        <div
          className={`flex flex-col ${
            showTerminals && "h-1/2"
          } overflow-auto mb-3 p-6 lg:p-6 pt-16 lg:pt-6`}
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
          <div className="h-1/2 px-3">
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
