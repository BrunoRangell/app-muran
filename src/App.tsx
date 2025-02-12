
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Clients from "@/pages/Clients";
import NotFound from "@/pages/NotFound";
import Managers from "@/pages/Managers";
import ManagerFinancial from "@/pages/ManagerFinancial";
import Tasks from "@/pages/Tasks";
import FinancialReport from "@/pages/FinancialReport";

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
        <Route path="/financeiro" element={<ManagerFinancial />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
