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

import { useRouter } from "./hooks/useRouter";
import { AppProvider } from "./contexts/AppContext";
import Sidebar from "./components/Sidebar";

function AppContent() {
  const { getParam } = useRouter();
  const currentPage = getParam("page") || "containers";

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "containers":
        return <ContainersPage />;
      case "images":
        return <Images />;
      case "networks":
        return <Networks />;
      case "volumes":
        return <Volumes />;
      case "volume-details":
        return <VolumeDetails />;
      case "settings":
        return <Settings />;
      case "about":
        return <About />;
      default:
        return <ContainersPage />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-primary transition-colors flex">
      <Sidebar />
      <div className="flex-grow shrink-0 overflow-hidden">
        <main className="h-full">{renderCurrentPage()}</main>
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
