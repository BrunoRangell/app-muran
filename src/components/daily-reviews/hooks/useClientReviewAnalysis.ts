
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
  const [lastAnalysisTimestamp, setLastAnalysisTimestamp] = useState<number>(0);

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
    
    // Limitamos a invalidação apenas para as queries essenciais
    // Não invalidamos "clients-with-reviews" aqui para evitar loops de atualização
    
    // Atualizar os dados
    onRefreshComplete();
    setIsRefreshing(false);
    
    // Registrar timestamp da análise
    setLastAnalysisTimestamp(Date.now());
  });

  const handleRefreshAnalysis = () => {
    // Evitar análises muito frequentes (não mais de uma vez por minuto)
    const now = Date.now();
    if (now - lastAnalysisTimestamp < 60000) {
      console.log("Análise ignorada - muito frequente. Tentativa:", 
        new Date().toISOString(), 
        "Última análise:", 
        new Date(lastAnalysisTimestamp).toISOString());
        
      toast({
        title: "Aguarde um momento",
        description: "Você já realizou uma análise recentemente. Aguarde pelo menos 1 minuto para analisar novamente.",
      });
      return;
    }
    
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
