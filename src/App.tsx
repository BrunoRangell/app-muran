import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Toaster } from "./components/ui/toaster";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import Login from "./pages/Login";
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <PrivateRoute requireAdmin>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requireAdmin>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <PrivateRoute requireAdmin>
              <Layout>
                <Clients />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <PrivateRoute>
              <Layout>
                <Financial />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/gestores"
          element={
            <PrivateRoute>
              <Layout>
                <Managers />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <Layout>
                <Admin />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/gestor/financeiro"
          element={
            <PrivateRoute>
              <Layout>
                <ManagerFinancial />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;