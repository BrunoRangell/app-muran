import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import Managers from "@/pages/Managers";
import ManagerFinancial from "@/pages/ManagerFinancial";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Index />} />
        <Route path="/equipe" element={<Managers />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requireAdmin>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <PrivateRoute requireAdmin>
              <Clients />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <PrivateRoute>
              <ManagerFinancial />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;