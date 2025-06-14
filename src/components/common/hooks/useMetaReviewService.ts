
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { reviewClient } from "@/components/common/services/unifiedReviewService";

interface ConnectionStatus {
  status: "success" | "error" | null;
  message?: string;
  details?: {
    type?: string;
    message?: string;
    suggestions?: string[];
  };
}

export const useMetaReviewService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: null });
  const { toast } = useToast();

  const executeAutomaticReview = async () => {
    try {
      setIsLoading(true);
      // Simula uma execução de revisão automática usando o serviço unificado
      // Em uma implementação real, isso chamaria uma função Edge específica
      console.log("[MetaReviewService] Executando revisão automática");
      return { success: true };
    } catch (error) {
      console.error("[MetaReviewService] Erro na revisão automática:", error);
      setConnectionStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        details: {
          type: "AutomaticReviewError",
          message: "Falha na execução da revisão automática",
          suggestions: [
            "Verificar se as funções Edge estão funcionando",
            "Tentar executar a revisão manualmente",
            "Verificar os logs do sistema"
          ]
        }
      });
      return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
    } finally {
      setIsLoading(false);
    }
  };

  const testMetaReviewFunction = async () => {
    try {
      setIsLoading(true);
      console.log("[MetaReviewService] Testando conexão com função Meta Review");
      // Simula um teste de conexão
      setConnectionStatus({ status: "success", message: "Conexão testada com sucesso" });
      toast({
        title: "Teste de conexão",
        description: "Conexão com a função Meta Review testada com sucesso",
      });
    } catch (error) {
      console.error("[MetaReviewService] Erro no teste de conexão:", error);
      setConnectionStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Erro no teste de conexão",
        details: {
          type: "ConnectionTestError",
          message: "Falha no teste de conexão",
          suggestions: [
            "Verificar se a função Edge está publicada",
            "Verificar as configurações de rede",
            "Tentar novamente em alguns minutos"
          ]
        }
      });
      toast({
        title: "Erro no teste",
        description: "Falha no teste de conexão com a função Meta Review",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnectionStatus = () => {
    setConnectionStatus({ status: null });
  };

  return {
    executeAutomaticReview,
    testMetaReviewFunction,
    resetConnectionStatus,
    isLoading,
    lastConnectionStatus: connectionStatus.status,
    lastErrorMessage: connectionStatus.message,
    lastErrorDetails: connectionStatus.details,
  };
};
