import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClientsWithReviews } from "./services/clientReviewService";

export const useBatchReview = () => {
  const { toast } = useToast();
  const [clientsWithReviews, setClientsWithReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingClients, setProcessingClients] = useState([]);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const queryClient = useQueryClient();
  
  const { analyzeMutation } = useClientAnalysis((data) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente atualizada com sucesso.`,
    });
    
    setProcessingClients(prev => prev.filter(id => id !== data.clientId));
    queryClient.invalidateQueries({ queryKey: ["client-detail", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", data.clientId] });
    loadClients();
  });
  
  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const clients = await fetchClientsWithReviews();
      setClientsWithReviews(clients);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      toast({
        title: "Análise em andamento",
        description: "Este cliente já está sendo analisado.",
      });
      return;
    }
    
    setProcessingClients(prev => [...prev, clientId]);
    console.log(`Iniciando análise para cliente: ${clientId}`);
    
    try {
      await analyzeMutation.mutateAsync(clientId);
      toast({
        title: "Análise concluída",
        description: `Análise do cliente ${clientId} concluída com sucesso.`,
      });
    } catch (error) {
      console.error("Erro na análise do cliente:", error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [analyzeMutation, processingClients, toast]);
  
  const reviewAllClients = async () => {
    try {
      setIsBatchAnalyzing(true);
      
      // Resetar o progresso antes de iniciar
      setBatchProgress(0);
      
      // Obter a lista de clientes a serem analisados
      const clientsToProcess = clientsWithReviews.filter(client => client.meta_account_id);
      setTotalClientsToAnalyze(clientsToProcess.length);
      
      if (clientsToProcess.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: "Não há clientes com Meta Ads configurado.",
        });
        setIsBatchAnalyzing(false);
        return;
      }
      
      const clientIds = clientsToProcess.map(client => client.id);
      setProcessingClients(prev => [...new Set([...prev, ...clientIds])]);
      
      // Processar cada cliente e atualizar o progresso corretamente
      let currentProgress = 0;
      
      for (const client of clientsToProcess) {
        console.log(`Iniciando análise para cliente: ${client.company_name} (${client.id})`);
        
        try {
          await analyzeMutation.mutateAsync(client.id);
          
          // Incrementar o progresso apenas após o processamento bem-sucedido
          currentProgress++;
          setBatchProgress(currentProgress);
          
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, err);
          // Mesmo em caso de erro, incrementar o progresso
          currentProgress++;
          setBatchProgress(currentProgress);
        }
      }
      
      toast({
        title: "Análise em lote concluída",
        description: `Foram processados ${clientsToProcess.length} clientes.`,
      });
      
      const now = new Date();
      setLastBatchReviewTime(now);
      
    } catch (error) {
      console.error("Erro ao processar análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a análise em lote",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
      // Não resetar o progresso aqui, para permitir que o usuário veja o resultado final
      loadClients();
    }
  };
  
  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    refetchClients: loadClients
  };
};
