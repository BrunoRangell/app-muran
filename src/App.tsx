
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";

// Layouts
import { Layout } from "./components/layout/Layout";

// Pages
import Login from "./pages/Login";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import NovoRecebimentos from "./pages/NovoRecebimentos";
import Costs from "./pages/Costs";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Financial from "./pages/Financial";
import Managers from "./pages/Managers";
import ManagerFinancial from "./pages/ManagerFinancial";
import UserDashboard from "./pages/UserDashboard";
import FinancialReport from "./pages/FinancialReport";

// Components
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { AuthCallback } from "./components/auth/AuthCallback";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Index />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="clientes/recebimentos" element={<Payments />} />
          <Route path="novo-recebimentos" element={<NovoRecebimentos />} />
          <Route path="financeiro" element={<Financial />} />
          <Route path="financeiro/relatorio" element={<FinancialReport />} />
          <Route path="custos" element={<Costs />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route
            path="gerentes"
            element={
              <PrivateRoute requireAdmin>
                <Managers />
              </PrivateRoute>
            }
          />
          <Route
            path="gerentes/financeiro"
            element={
              <PrivateRoute requireAdmin>
                <ManagerFinancial />
              </PrivateRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
