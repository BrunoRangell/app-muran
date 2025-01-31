import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Toaster } from "./components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Financial from "./pages/Financial";
import Managers from "./pages/Managers";
import Admin from "./pages/Admin";
import ManagerFinancial from "./pages/ManagerFinancial";
import NotFound from "./pages/NotFound";
import { AuthCallback } from "./components/auth/AuthCallback";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/gestores" element={<Managers />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/gestor/financeiro" element={<ManagerFinancial />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;