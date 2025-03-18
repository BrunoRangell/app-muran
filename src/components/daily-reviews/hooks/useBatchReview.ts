
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchClientsWithReviews, analyzeClient, analyzeAllClients } from "./services/clientReviewService";

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  // Novo estado para rastrear o progresso
  const [batchProgress, setBatchProgress] = useState(0);
  // Número total de clientes a serem analisados
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  // Estado local para o timestamp da última revisão em massa
  const [localLastReviewTime, setLocalLastReviewTime] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta principal para obter clientes com revisões
  const { 
    data: clientsWithReviewsData,
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: fetchClientsWithReviews,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const clientsWithReviews = clientsWithReviewsData?.clientsData;
  // Usar o timestamp local se disponível, caso contrário usar o do server
  const lastReviewTime = localLastReviewTime || clientsWithReviewsData?.lastReviewTime;
  
  // Função para recarregar dados
  const refetchClients = useCallback(async () => {
    console.log("Recarregando dados dos clientes...");
    await refetch();
  }, [refetch]);

  // Função para revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      console.log(`Cliente ${clientId} já está em processamento.`);
      return;
    }

    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      console.log(`Iniciando análise para cliente ${clientId}`);
      const result = await analyzeClient(clientId, clientsWithReviews);
      
      toast({
        title: "Análise concluída",
        description: "Orçamentos de Meta Ads atualizados com sucesso!",
      });
      
      console.log("Análise concluída com sucesso:", result);
      await refetchClients();
      
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise do cliente.",
        variant: "destructive",
      });
      
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, clientsWithReviews, toast, refetchClients]);

  // Função para revisar todos os clientes - sempre atualiza as revisões
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing) {
      console.log("Já existe uma análise em massa em andamento.");
      return;
    }

    if (!clientsWithReviews || clientsWithReviews.length === 0) {
      console.log("Nenhum cliente disponível para análise.");
      toast({
        title: "Nenhum cliente disponível",
        description: "Não há clientes disponíveis para analisar.",
        variant: "destructive",
      });
      return;
    }

    // Filtrar apenas clientes com ID de conta Meta configurado
    const eligibleClients = clientsWithReviews.filter(client => 
      client.meta_account_id && client.meta_account_id.trim() !== ""
    );
    
    if (eligibleClients.length === 0) {
      toast({
        title: "Nenhum cliente elegível",
        description: "Nenhum cliente com conta Meta Ads configurada.",
        variant: "destructive",
      });
      return;
    }
    
    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(eligibleClients.length);
    
    // Atualizar o timestamp da revisão em massa para agora
    setLocalLastReviewTime(new Date());

    try {
      console.log("Iniciando análise em massa...");
      
      const handleClientStart = (clientId: string) => {
        setProcessingClients(prev => [...prev, clientId]);
      };
      
      const handleClientEnd = (clientId: string) => {
        setProcessingClients(prev => prev.filter(id => id !== clientId));
        // Atualizar progresso quando um cliente for concluído
        setBatchProgress(prev => {
          const newProgress = prev + 1;
          return newProgress;
        });
      };
      
      const result: BatchReviewResult = await analyzeAllClients(
        clientsWithReviews,
        handleClientStart,
        handleClientEnd
      );
      
      console.log("Análise em massa concluída:", result);
      
      const successCount = result.results.length;
      const errorCount = result.errors.length;
      
      if (successCount > 0 || errorCount > 0) {
        toast({
          title: "Análise em massa concluída",
          description: `${successCount} análises concluídas com sucesso. ${errorCount} falhas.`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Nenhum cliente analisado",
          description: "Não foi possível analisar nenhum cliente.",
          variant: "destructive",
        });
      }
      
      await refetchClients();
      
    } catch (error) {
      console.error("Erro na análise em massa:", error);
      
      toast({
        title: "Erro na análise em massa",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise em massa.",
        variant: "destructive",
      });
      
    } finally {
      setIsBatchAnalyzing(false);
      setProcessingClients([]);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  }, [isBatchAnalyzing, clientsWithReviews, toast, refetchClients]);

  // Monitorar mudanças nos clientes em processamento
  useEffect(() => {
    console.log("Clientes em processamento:", processingClients);
  }, [processingClients]);

  return {
    clientsWithReviews,
    lastReviewTime,
    isLoading,
    processingClients,
    isBatchAnalyzing,
    reviewSingleClient,
    reviewAllClients,
    refetchClients,
    // Retornar informações de progresso
    batchProgress,
    totalClientsToAnalyze
  };
};
