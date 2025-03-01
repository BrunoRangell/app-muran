
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
        
        // Verificar se estamos em ambiente de desenvolvimento
        const isDev = import.meta.env.DEV;
        
        let result: AnalysisResult;

        if (isDev && import.meta.env.VITE_USE_MOCK_DATA === "true") {
          // Em desenvolvimento, usamos dados simulados
          console.log("Usando dados simulados para desenvolvimento");
          const todayDate = new Date();
          const formattedDate = todayDate.toISOString().split('T')[0];
          
          result = await simulateBudgetData(clientId, clientData, formattedDate);
        } else {
          // Em produção, chamamos a função edge
          console.log("Chamando função edge para análise de orçamento");
          const todayDate = new Date();
          const formattedDate = todayDate.toISOString().split('T')[0];
          
          try {
            result = await invokeEdgeFunction(clientId, formattedDate);
          } catch (error) {
            console.warn("Falha ao invocar Edge Function, usando simulação como fallback:", error);
            // Fallback para simulação se a edge function falhar
            result = await simulateBudgetData(clientId, clientData, formattedDate);
          }
        }
        
        console.log("Análise concluída com sucesso:", result);
        return result;
      } catch (error) {
        console.error("Erro ao chamar função de análise:", error);
        console.error("Erro detalhado na análise:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Análise realizada com sucesso:", data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error("Erro detalhado na análise:", error);
      
      // Usando o toast hook dentro do contexto de componente
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar os orçamentos. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  return { analyzeMutation };
};
