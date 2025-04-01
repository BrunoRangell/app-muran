
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";
import { useQueryClient } from "@tanstack/react-query";

export const useClientReviewAnalysis = (
  clientId: string,
  onRefreshComplete: () => void
) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Importamos o hook useClientAnalysis para analisar o cliente
  const { analyzeMutation } = useClientAnalysis((data) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente atualizada com sucesso.`,
    });
    
    // Após análise bem-sucedida, invalidamos as consultas relevantes
    queryClient.invalidateQueries({ queryKey: ["client-detail", clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", clientId] });
    
    // Atualizar os dados
    onRefreshComplete();
    setIsRefreshing(false);
  });

  const handleRefreshAnalysis = () => {
    setIsRefreshing(true);
    
    try {
      console.log("Iniciando análise para o cliente:", clientId);
      analyzeMutation.mutate(clientId, {
        onError: (error) => {
          console.error("Erro na análise do cliente:", error);
          setIsRefreshing(false);
          
          // Mensagens de toast já são exibidas no hook useClientAnalysis
        }
      });
    } catch (error) {
      console.error("Erro ao iniciar análise:", error);
      setIsRefreshing(false);
      
      toast({
        title: "Erro ao iniciar análise",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a análise.",
        variant: "destructive",
      });
    }
  };

  return {
    isRefreshing,
    isAnalyzing: analyzeMutation.isPending,
    handleRefreshAnalysis
  };
};
