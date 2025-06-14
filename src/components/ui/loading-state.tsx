
import { UnifiedLoading } from "@/components/common/UnifiedLoading";
import { useLocation } from "react-router-dom";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Carregando..." }: LoadingStateProps) => {
  const location = useLocation();
  const path = location.pathname;

  // Retorna o loading state específico baseado na rota atual
  if (path === "/clientes") {
    return <UnifiedLoading message="Carregando clientes..." size="md" />;
  }

  if (path === "/recebimentos-nova" || path === "/clientes/recebimentos") {
    return <UnifiedLoading message="Carregando recebimentos..." size="md" />;
  }

  // Por padrão, retorna o loading state com a mensagem fornecida
  return <UnifiedLoading message={message} size="md" />;
};
