
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { analyzeClient } from "./services/clientAnalysisService";

/**
 * Hook para análise de cliente individual
 */
export const useClientAnalysis = (onSuccess?: (data: any) => void) => {
  const { toast } = useToast();

  // Mutação para análise de cliente
  const analyzeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      console.log("Iniciando análise do cliente:", clientId);
      try {
        const result = await analyzeClient(clientId);
        console.log("Análise concluída com sucesso:", result);
        return result;
      } catch (error) {
        console.error("Erro na análise do cliente:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation onSuccess:", data);
      toast({
        title: "Análise concluída",
        description: "Cliente analisado com sucesso."
      });
      
      // Chamar callback de sucesso personalizado se fornecido
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      console.error("Mutation onError:", error);
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    analyzeMutation,
    isAnalyzing: analyzeMutation.isPending
  };
};
