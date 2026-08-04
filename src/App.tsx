import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { LoadingState } from "@/components/ui/loading-state";
import Login from "@/pages/Login";

// Pré-carregamento das rotas principais com retry
const Index = lazy(() => {
  const loadWithRetry = (retriesLeft = 3): Promise<any> => {
    return import("@/pages/Index").catch((err) => {
      if (retriesLeft > 0) {
        return new Promise(resolve => setTimeout(resolve, 1000)).then(() => loadWithRetry(retriesLeft - 1));
      }
      window.location.reload();
      throw err;
    });
  };
  const page = loadWithRetry();
  page.then(() => {
    Promise.all([
      import("@/pages/Clients"),
      import("@/pages/Managers")
    ]).catch(() => {});
  });
  return page;
});

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
const Offboarding = lazyWithTimeout(() => import("@/pages/Offboarding"));
const AudienceCreator = lazyWithTimeout(() => import("@/pages/AudienceCreator"));
const TrafficReports = lazyWithTimeout(() => import("@/pages/TrafficReports"));
const TrafficReportsDashboard = lazyWithTimeout(() => import("@/pages/TrafficReportsDashboard"));
const AnunciosAtivos = lazyWithTimeout(() => import("@/pages/AnunciosAtivos"));
const OAuthConsent = lazyWithTimeout(() => import("@/pages/OAuthConsent"));
const TaskSpaces = lazyWithTimeout(() => import("@/pages/TaskSpaces"));
const TaskMembers = lazyWithTimeout(() => import("@/pages/TaskMembers"));
const TasksShell = lazyWithTimeout(() => import("@/components/tasks/TasksShell"));

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/__due-preview" element={<DueDatePreviewTmp />} />
        {/* Rota pública do portal do cliente */}
        <Route path="/cliente/:accessToken" element={<TrafficReports />} />


        {/* Tela de consentimento OAuth (MCP) — rota pública, faz seu próprio check de sessão */}
        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
        <Route path="/oauth/consent" element={<OAuthConsent />} />

        <Route path="/login" element={<Login />} />

        {/* Módulo de tarefas — app standalone, fora do layout do app-muran */}
        <Route
          path="/tarefas"
          element={
            <PrivateRoute>
              <Suspense fallback={<LoadingState />}>
                <TasksShell />
              </Suspense>
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="espacos" element={<TaskSpaces />} />
          <Route path="minhas" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="clientes" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="internas" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="leads" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="membros" element={<TaskMembers />} />
        </Route>


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
            path="/offboarding"
            element={
              <PrivateRoute requireAdmin>
                <Offboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/audience-creator"
            element={
              <PrivateRoute>
                <AudienceCreator />
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
          <Route path="/revisao-diaria-avancada" element={<ImprovedDailyReviews />} />

          {/* Relatórios de Tráfego — modelo único, sem editor */}
          <Route path="/relatorios-trafego" element={<TrafficReportsDashboard />} />
          <Route path="/relatorios-trafego/visualizar" element={<TrafficReports />} />
          <Route path="/anuncios-ativos" element={<AnunciosAtivos />} />




          {/* Redirects das rotas antigas */}
          <Route path="/tarefas-clientes" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="/tarefas-internas" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="/minhas-tarefas" element={<Navigate to="/tarefas/espacos" replace />} />
          <Route path="/leads" element={<Navigate to="/tarefas/espacos" replace />} />

          <Route path="/financeiro" element={<Navigate to="/" replace />} />


          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
