
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";

export const useClientReviewAnalysis = (
  clientId: string,
  onRefreshComplete: () => void
) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Importamos o hook useClientAnalysis para analisar o cliente
  const { analyzeMutation } = useClientAnalysis((data) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente atualizada com sucesso.`,
    });
    
    // Após análise bem-sucedida, atualizamos os dados
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
