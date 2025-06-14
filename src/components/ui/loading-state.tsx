
import { UnifiedLoading } from "@/components/common/UnifiedLoading";
import { useLocation } from "react-router-dom";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Carregando..." }: LoadingStateProps) => {
  const location = useLocation();
  const path = location.pathname;

  if (path === "/clientes") {
    return <UnifiedLoading message="Carregando clientes..." size="md" />;
  }

  if (path === "/recebimentos-nova" || path === "/clientes/recebimentos") {
    return <UnifiedLoading message="Carregando recebimentos..." size="md" />;
  }

  return <UnifiedLoading message={message} size="md" />;
};
