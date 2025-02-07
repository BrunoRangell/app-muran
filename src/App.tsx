
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import Clients from "@/pages/Clients";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import Managers from "@/pages/Managers";
import Financial from "@/pages/Financial";
import Tasks from "@/pages/Tasks";

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
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route path="/financeiro" element={<Financial />} />
        <Route 
          path="/financeiro/:memberId" 
          element={
            <PrivateRoute requireAdmin>
              <Financial />
            </PrivateRoute>
          } 
        />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;

