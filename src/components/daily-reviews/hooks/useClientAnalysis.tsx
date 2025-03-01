
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateClient } from "./useClientValidation";
import { simulateBudgetData, simulateClientAnalysis } from "./useDevSimulation";
import { invokeEdgeFunction } from "./useEdgeFunction";
import { AnalysisResult } from "./types";

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
        
        // Sempre tentamos buscar dados reais da API do Meta
        try {
          const result = await invokeEdgeFunction(clientId, formattedDate);
          console.log("Análise com dados reais concluída com sucesso:", result);
          return result;
        } catch (error: any) {
          console.error("Erro ao buscar dados reais do Meta Ads:", error);
          
          // Mostrar mensagem específica ao usuário
          toast({
            title: "Erro na API do Meta Ads",
            description: error.message || "Não foi possível obter dados reais do Meta Ads.",
            variant: "destructive",
          });
          
          throw error;
        }
      } catch (error) {
        console.error("Erro ao chamar função de análise:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Análise realizada com sucesso:", data);
      toast({
        title: "Análise concluída",
        description: "Dados reais do Meta Ads obtidos com sucesso!",
      });
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error("Erro detalhado na análise:", error);
      
      // Já exibimos mensagem específica no catch acima, não precisamos duplicar
    },
  });

  return { analyzeMutation };
};
