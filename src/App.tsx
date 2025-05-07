
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
const lazyWithTimeout = (importFn: () => Promise<any>, retries = 3, timeout = 10000) => {
  return lazy(() => {
    const loadWithRetry = (retriesLeft = retries): Promise<any> => {
      return Promise.race([
        importFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tempo limite excedido')), timeout)
        )
      ]).catch(error => {
        console.error(`Erro ao carregar módulo: ${error.message}, tentativas restantes: ${retriesLeft}`);
        if (retriesLeft > 0) {
          console.log(`Tentando novamente... ${retriesLeft} tentativas restantes`);
          return loadWithRetry(retriesLeft - 1);
        }
        console.error("Falha em todas as tentativas de carregamento");
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
const RecebimentosNova = lazyWithTimeout(() => import("@/pages/RecebimentosNova"));
const Costs = lazyWithTimeout(() => import("@/pages/Costs"));
const Settings = lazyWithTimeout(() => import("@/pages/Settings"));
const DailyReviews = lazyWithTimeout(() => import("@/pages/DailyReviews"));
const RevisaoNova = lazyWithTimeout(() => import("@/pages/RevisaoNova"));

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
        <Route path="/configuracoes" element={<Settings />} />
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
          path="/recebimentos-nova"
          element={
            <PrivateRoute requireAdmin>
              <RecebimentosNova />
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
        <Route
          path="/revisoes-diarias"
          element={
            <PrivateRoute requireAdmin>
              <DailyReviews />
            </PrivateRoute>
          }
        />
        <Route path="/revisao-meta" element={<RevisaoNova />} />
        <Route path="/financeiro" element={<ManagerFinancial />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
