
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { lazy, Suspense } from "react";
import Login from "@/pages/Login";

// Pré-carregamento das rotas principais
const Index = lazy(() => {
  const page = import("@/pages/Index");
  // Pré-carregar outras páginas após a página inicial carregar
  page.then(() => {
    Promise.all([
      import("@/pages/Clients"),
      import("@/pages/Managers")
    ]).catch(error => {
      console.error("Erro no pré-carregamento:", error);
    });
  });
  return page;
});

// Lazy load das demais páginas com timeout maior e retry
const lazyWithTimeout = (importFn: () => Promise<any>) => {
  return lazy(() => {
    const loadWithRetry = (retries = 2): Promise<any> => {
      return Promise.race([
        importFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tempo limite excedido')), 8000)
        )
      ]).catch(error => {
        if (retries > 0) {
          console.log(`Tentando novamente... ${retries} tentativas restantes`);
          return loadWithRetry(retries - 1);
        }
        throw error;
      });
    };

    return loadWithRetry();
  });
};

const Clients = lazyWithTimeout(() => import("@/pages/Clients"));
const NotFound = lazyWithTimeout(() => import("@/pages/NotFound"));
const Managers = lazyWithTimeout(() => import("@/pages/Managers"));
const ManagerFinancial = lazyWithTimeout(() => import("@/pages/ManagerFinancial"));
const Tasks = lazyWithTimeout(() => import("@/pages/Tasks"));
const FinancialReport = lazyWithTimeout(() => import("@/pages/FinancialReport"));
const Payments = lazyWithTimeout(() => import("@/pages/Payments"));
const Costs = lazyWithTimeout(() => import("@/pages/Costs"));

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
