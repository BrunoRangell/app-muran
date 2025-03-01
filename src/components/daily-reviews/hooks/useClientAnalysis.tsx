
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateClient } from "./useClientValidation";
import { invokeEdgeFunction } from "./useEdgeFunction";
import { AnalysisResult } from "./types";
import { AppError, handleApiError } from "@/lib/errors";

export const useClientAnalysis = (onSuccess?: (data: AnalysisResult) => void) => {
  const { toast } = useToast();

  // Mutation para analisar o cliente
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log("Iniciando análise para o cliente:", clientId);
      
      try {
        // Validação do cliente
        const clientData = await validateClient(clientId);
        
        // Verificar se o cliente tem ID de conta Meta configurado
        if (!clientData.meta_account_id) {
          toast({
            title: "Cliente sem conta Meta",
            description: "Este cliente não possui ID de conta Meta configurado.",
            variant: "destructive",
          });
          throw new Error("Cliente sem ID de conta Meta configurado");
        }
        
        console.log("Buscando dados reais da API do Meta Ads");
        const todayDate = new Date();
        const formattedDate = todayDate.toISOString().split('T')[0];
        
        // Buscar apenas dados reais - sem simulação
        console.log("Chamando função Edge para obter dados reais do Meta Ads");
        const result = await invokeEdgeFunction(clientId, formattedDate);
        console.log("Análise com dados reais concluída com sucesso:", result);
        return result;
      } catch (error) {
        console.error("Erro ao chamar função de análise:", error);
        
        // Caso haja erro com o token, vamos exibir mensagem específica
        if (error instanceof Error && error.message?.includes("Token Meta Ads não configurado")) {
          toast({
            title: "Token do Meta Ads não configurado",
            description: "Configure o token do Meta Ads na página de configurações antes de analisar.",
            variant: "destructive",
          });
        } else {
          // Para outros erros da API, mostrar mensagem genérica
          toast({
            title: "Erro na API do Meta Ads",
            description: error instanceof Error ? error.message : "Não foi possível obter dados do Meta Ads.",
            variant: "destructive",
          });
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Análise realizada com sucesso:", data);
      toast({
        title: "Análise concluída",
        description: "Dados obtidos com sucesso!",
      });
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error("Erro detalhado na análise:", error);
      // Mensagens específicas já são exibidas no try/catch acima
    },
  });

  return { analyzeMutation };
};
