
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";

// Pré-carregamento das rotas principais
const Index = lazy(() => {
  const page = import("@/pages/Index");
  // Pré-carregar outras páginas após a página inicial carregar
  page.then(() => {
    Promise.all([
      import("@/pages/Clients"),
      import("@/pages/Managers")
    ]).catch(() => {
      // Silencioso em produção
    });
  });
  return page;
});

// Lazy load otimizado com timeout reduzido
const lazyWithTimeout = (importFn: () => Promise<any>, retries = 3, timeout = 5000) => {
  return lazy(() => {
    const loadWithRetry = (retriesLeft = retries): Promise<any> => {
      return Promise.race([
        importFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tempo limite excedido')), timeout)
        )
      ]).catch(error => {
        if (import.meta.env.DEV) {
          console.error(`Erro ao carregar módulo: ${error.message}, tentativas restantes: ${retriesLeft}`);
        }
        if (retriesLeft > 0) {
          return loadWithRetry(retriesLeft - 1);
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

const FinancialReport = lazyWithTimeout(() => import("@/pages/FinancialReport"));
const RecebimentosNova = lazyWithTimeout(() => import("@/pages/RecebimentosNova"));
const Costs = lazyWithTimeout(() => import("@/pages/Costs"));
const Settings = lazyWithTimeout(() => import("@/pages/Settings"));
const ImprovedDailyReviews = lazyWithTimeout(() => import("@/pages/ImprovedDailyReviews"));
const Onboarding = lazyWithTimeout(() => import("@/pages/Onboarding"));


function App() {
  return (
    <TooltipProvider>
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
            path="/onboarding"
            element={
              <PrivateRoute requireAdmin>
                <Onboarding />
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
          {/* Página principal de revisão diária */}
            <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />
          
          {/* Redirecionamento da rota antiga do financeiro para a página inicial */}
          <Route path="/financeiro" element={<Navigate to="/" replace />} />
          
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </TooltipProvider>
  );
}

export default App;
