
import { DashboardLoadingState } from "@/components/loading-states/DashboardLoadingState";
import { ClientsLoadingState } from "@/components/loading-states/ClientsLoadingState";
import { PaymentsLoadingState } from "@/components/loading-states/PaymentsLoadingState";
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

  if (path === "/clientes/recebimentos") {
    return <PaymentsLoadingState />;
  }

  // Por padrão, retorna o loading state do dashboard
  return <DashboardLoadingState />;
};
