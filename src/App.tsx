
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { lazy } from "react";
import Login from "@/pages/Login";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Clients = lazy(() => import("@/pages/Clients"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Managers = lazy(() => import("@/pages/Managers"));
const ManagerFinancial = lazy(() => import("@/pages/ManagerFinancial"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const FinancialReport = lazy(() => import("@/pages/FinancialReport"));
const Payments = lazy(() => import("@/pages/Payments"));
const Costs = lazy(() => import("@/pages/Costs"));

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Index />} />
        <Route path="/equipe" element={<Managers />} />
        <Route
          path="/clientes"
          element={
            <PrivateRoute requireAdmin>
              <Clients />
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes/relatorio"
          element={
            <PrivateRoute requireAdmin>
              <FinancialReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes/recebimentos"
          element={
            <PrivateRoute requireAdmin>
              <Payments />
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes/custos"
          element={
            <PrivateRoute requireAdmin>
              <Costs />
            </PrivateRoute>
          }
        />
        <Route path="/financeiro" element={<ManagerFinancial />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
