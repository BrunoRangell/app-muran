
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
    analyzeMutation.mutate(clientId);
  };

  return {
    isRefreshing,
    isAnalyzing: analyzeMutation.isPending,
    handleRefreshAnalysis
  };
};
