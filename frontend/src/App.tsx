import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { VmsPage } from "./pages/VmsPage";
import { VmDetailPage } from "./pages/VmDetailPage";
import { FirewallsPage } from "./pages/FirewallsPage";
import { ProjectsPage } from "./pages/ProjectsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/vms" replace />} />
        <Route path="/vms" element={<VmsPage />} />
        <Route path="/vms/:zone/:name" element={<VmDetailPage />} />
        <Route path="/firewalls" element={<FirewallsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Route>
    </Routes>
  );
}
