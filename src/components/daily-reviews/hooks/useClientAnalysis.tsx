
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateClient } from "./useClientValidation";
import { simulateBudgetData, simulateClientAnalysis } from "./useDevSimulation";
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
        
        // Verificar se estamos em ambiente de desenvolvimento com simulação ativada
        const useMockData = import.meta.env.VITE_USE_MOCK_DATA === "true";
        
        if (useMockData) {
          console.log("Usando dados simulados devido à configuração de ambiente");
          return await simulateClientAnalysis(clientId, clientData);
        }
        
        // Sempre tentamos buscar dados reais da API do Meta
        try {
          console.log("Chamando função Edge para obter dados reais do Meta Ads");
          const result = await invokeEdgeFunction(clientId, formattedDate);
          console.log("Análise com dados reais concluída com sucesso:", result);
          return result;
        } catch (error: any) {
          console.error("Erro ao buscar dados reais do Meta Ads:", error);
          
          // Verificar se o erro é relacionado ao token
          if (error.message?.includes("Token Meta Ads não configurado")) {
            toast({
              title: "Token do Meta Ads não configurado",
              description: "Configure o token do Meta Ads na página de configurações antes de analisar.",
              variant: "destructive",
            });
            throw error;
          }
          
          // Se for outro erro da API, mostrar mensagem específica
          toast({
            title: "Erro na API do Meta Ads",
            description: error.message || "Não foi possível obter dados reais do Meta Ads.",
            variant: "destructive",
          });
          
          // Em caso de erro na API real, podemos cair para simulação se for ambiente de desenvolvimento
          if (import.meta.env.DEV) {
            console.log("Caindo para simulação devido ao erro na API real (ambiente de desenvolvimento)");
            toast({
              title: "Usando dados simulados",
              description: "Devido a um erro na API do Meta, estamos usando dados simulados.",
            });
            return await simulateClientAnalysis(clientId, clientData);
          }
          
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
        description: "Dados obtidos com sucesso!",
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
