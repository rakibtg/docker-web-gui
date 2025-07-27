import {
  About,
  Images,
  Volumes,
  Networks,
  Settings,
  Dashboard,
  ImageDetails,
  VolumeDetails,
  ContainersPage,
  ContainerDetails,
} from "./pages";

import { AppProvider } from "./contexts";
import Sidebar from "./components/Sidebar";
import { Layout, TerminalToggle } from "./components";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTerminalCleanup } from "./hooks/useTerminalCleanup";

function AppContent() {
  useTerminalCleanup();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 transition-colors flex">
      <Sidebar />
      <div className="flex-grow shrink-0 overflow-hidden">
        <Layout>
          <main className="h-full">
            <Routes>
              <Route path="/" element={<Navigate to="/containers" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/containers" element={<ContainersPage />} />
              <Route
                path="/containers/:containerId"
                element={<ContainerDetails />}
              />
              <Route path="/images" element={<Images />} />
              <Route path="/images/:imageId" element={<ImageDetails />} />
              <Route path="/networks" element={<Networks />} />
              <Route path="/volumes" element={<Volumes />} />
              <Route path="/volumes/:volumeId" element={<VolumeDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              {/* Fallback to containers for unknown routes */}
              <Route path="*" element={<Navigate to="/containers" replace />} />
            </Routes>
          </main>
        </Layout>
      </div>
      <TerminalToggle />
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
