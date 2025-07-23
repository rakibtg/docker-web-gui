import { Routes, Route, Navigate } from "react-router-dom";
import {
  Dashboard,
  ContainersPage,
  Images,
  Networks,
  Volumes,
  VolumeDetails,
  Settings,
  About,
} from "./pages";

import { AppProvider } from "./contexts";
import Sidebar from "./components/Sidebar";

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 transition-colors flex">
      <Sidebar />
      <div className="flex-grow shrink-0 overflow-hidden">
        <main className="h-full">
          <Routes>
            <Route path="/" element={<Navigate to="/containers" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/images" element={<Images />} />
            <Route path="/networks" element={<Networks />} />
            <Route path="/volumes" element={<Volumes />} />
            <Route path="/volumes/:volumeId" element={<VolumeDetails />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            {/* Fallback to containers for any unknown routes */}
            <Route path="*" element={<Navigate to="/containers" replace />} />
          </Routes>
        </main>
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
