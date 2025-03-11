import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import ContainersPage from "./pages/Containers.page";
import ImagesPage from "./pages/Images.page";
import VolumesPage from "./pages/Volumes.page";
import AuditLogsPage from "./pages/AuditLogs.page";
import HistoryPage from "./pages/History.page";
import AboutPage from "./pages/About.page";

const AppRouter = () => {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<ContainersPage />} />
                <Route path="container" element={<ContainersPage />} />
                <Route path="image" element={<ImagesPage />} />
                <Route path="volume" element={<VolumesPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="about" element={<AboutPage />} />
            </Route>
        </Routes>
    );
}

export default AppRouter;