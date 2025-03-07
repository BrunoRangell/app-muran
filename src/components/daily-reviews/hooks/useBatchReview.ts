
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchClientsWithReviews, analyzeClient, analyzeAllClients } from "./services/clientReviewService";

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
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
  const lastReviewTime = clientsWithReviewsData?.lastReviewTime;
  
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
      // Adicionar ao estado de processamento
      setProcessingClients(prev => [...prev, clientId]);
      
      // Executar análise
      console.log(`Iniciando análise para cliente ${clientId}`);
      const result = await analyzeClient(clientId, clientsWithReviews);
      
      // Notificar sucesso
      toast({
        title: "Análise concluída",
        description: "Orçamentos de Meta Ads atualizados com sucesso!",
      });
      
      console.log("Análise concluída com sucesso:", result);
      
      // Atualizar dados após análise bem-sucedida
      await refetchClients();
      
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      
      // Notificar erro
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise do cliente.",
        variant: "destructive",
      });
      
    } finally {
      // Remover do estado de processamento
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, clientsWithReviews, toast, refetchClients]);

  // Função para revisar todos os clientes
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

    // Configurar estado de processamento em massa
    setIsBatchAnalyzing(true);

    try {
      // Iniciar análise em massa
      console.log("Iniciando análise em massa...");
      
      // Callbacks para gerenciar estado de processamento
      const handleClientStart = (clientId: string) => {
        setProcessingClients(prev => [...prev, clientId]);
      };
      
      const handleClientEnd = (clientId: string) => {
        setProcessingClients(prev => prev.filter(id => id !== clientId));
      };
      
      // Executar análise em massa
      const result: BatchReviewResult = await analyzeAllClients(
        clientsWithReviews,
        handleClientStart,
        handleClientEnd
      );
      
      console.log("Análise em massa concluída:", result);
      
      // Notificar resultados
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
      
      // Atualizar dados após análise
      await refetchClients();
      
    } catch (error) {
      console.error("Erro na análise em massa:", error);
      
      toast({
        title: "Erro na análise em massa",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise em massa.",
        variant: "destructive",
      });
      
    } finally {
      // Limpar estado de processamento
      setIsBatchAnalyzing(false);
      setProcessingClients([]);
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
    refetchClients
  };
};
