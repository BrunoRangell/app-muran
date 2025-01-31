import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { AuthCallback } from "@/components/auth/AuthCallback";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import UserDashboard from "@/pages/UserDashboard";
import Clients from "@/pages/Clients";
import Admin from "@/pages/Admin";
import Financial from "@/pages/Financial";
import ManagerFinancial from "@/pages/ManagerFinancial";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route element={<Layout />}>
          <Route element={<PrivateRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inicio" element={<UserDashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="equipe" element={<Admin />} />
            <Route path="financeiro" element={<Financial />} />
            <Route path="gestor/financeiro" element={<ManagerFinancial />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;