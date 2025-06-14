
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { lazy, Suspense } from "react";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

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
const Tasks = lazyWithTimeout(() => import("@/pages/Tasks"));
const FinancialReport = lazyWithTimeout(() => import("@/pages/FinancialReport"));
const RecebimentosNova = lazyWithTimeout(() => import("@/pages/RecebimentosNova"));
const Costs = lazyWithTimeout(() => import("@/pages/Costs"));
const Settings = lazyWithTimeout(() => import("@/pages/Settings"));
const ImprovedDailyReviews = lazyWithTimeout(() => import("@/pages/ImprovedDailyReviews"));
const CampaignHealthReport = lazyWithTimeout(() => import("@/pages/CampaignHealthReport"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <Index />
              </Suspense>
            } />
            <Route path="/equipe" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <Managers />
              </Suspense>
            } />
            <Route path="/configuracoes" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <Settings />
              </Suspense>
            } />
            <Route
              path="/clientes"
              element={
                <PrivateRoute requireAdmin>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <Clients />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="/clientes/relatorio"
              element={
                <PrivateRoute requireAdmin>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <FinancialReport />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="/recebimentos-nova"
              element={
                <PrivateRoute requireAdmin>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <RecebimentosNova />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="/clientes/custos"
              element={
                <PrivateRoute requireAdmin>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <Costs />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route path="/revisao-diaria-avancada" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <ImprovedDailyReviews />
              </Suspense>
            } />
            <Route path="/revisoes-diarias" element={<Navigate to="/revisao-diaria-avancada" replace />} />
            <Route path="/revisao-meta" element={<Navigate to="/revisao-diaria-avancada" replace />} />
            <Route path="/financeiro" element={<Navigate to="/" replace />} />
            <Route path="/tarefas" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <Tasks />
              </Suspense>
            } />
            <Route path="/relatorio-saude-campanhas" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <CampaignHealthReport />
              </Suspense>
            } />
            <Route path="*" element={
              <Suspense fallback={<div>Carregando...</div>}>
                <NotFound />
              </Suspense>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
