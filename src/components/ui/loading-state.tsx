
import { DashboardLoadingState } from "@/components/loading-states/DashboardLoadingState";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";
import { useLocation } from "react-router-dom";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Carregando..." }: LoadingStateProps) => {
  const location = useLocation();
  const path = location.pathname;

  // Retorna o loading state específico baseado na rota atual
  if (path === "/clientes") {
    return <ClientsLoadingState />;
  }

  // Para recebimentos, usa o loading state padrão
  if (path === "/recebimentos-nova" || path === "/clientes/recebimentos") {
    return <DashboardLoadingState />;
  }

  // Por padrão, retorna o loading state do dashboard
  return <DashboardLoadingState />;
};
