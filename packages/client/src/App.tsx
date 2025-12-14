import {
  About,
  Images,
  Volumes,
  Networks,
  Dashboard,
  ImageDetails,
  VolumeDetails,
  ContainersPage,
  ContainerDetails,
  Cleanup,
} from "./pages";

import { useApp } from "./hooks/useApp";
import { AppProvider } from "./contexts";
import Sidebar from "./components/Sidebar";
import { AuthGuard } from "./components/AuthGuard";
import { AuthProvider } from "./contexts/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTerminalCleanup } from "./hooks/useTerminalCleanup";
import { Layout, TerminalToggle, IPAccessDenied } from "./components";

function AppContent() {
  useTerminalCleanup();
  const { ipAccessDenied, userIP } = useApp();

  // Show IP access denied page if access is denied
  if (ipAccessDenied) {
    return <IPAccessDenied userIP={userIP || undefined} />;
  }

  return (
    <AuthGuard>
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
                <Route path="/cleanup" element={<Cleanup />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<Navigate to="/containers" replace />} />
              </Routes>
            </main>
            <TerminalToggle />
          </Layout>
        </div>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
