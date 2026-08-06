import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useTaskAuth } from "@/hooks/useTaskAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Spinner = () => (
  <div className="tasks-dark flex min-h-screen items-center justify-center bg-background">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
  </div>
);

/** Guard das rotas /tarefas/*: exige papel no módulo de tarefas (member/admin ou guest com grant). */
export const TaskPrivateRoute = ({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) => {
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const { data: taskAuth, isLoading: taskLoading } = useTaskAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/tarefas/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (taskLoading || !taskAuth) return <Spinner />;

  if (!taskAuth.hasTasksAccess) {
    return (
      <div className="tasks-dark flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-1 font-semibold">Acesso negado</div>
            <div className="text-sm">
              Sua conta não tem acesso ao módulo de tarefas. Peça a um administrador de tarefas
              para enviar um convite.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (requireAdmin && !taskAuth.isTaskAdmin) {
    return <Navigate to="/tarefas/espacos" replace />;
  }

  return <>{children}</>;
};
