
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview } from "./types/reviewTypes";
import { fetchClientsWithReviews, analyzeClient, analyzeAllClients } from "./services/clientService";

export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const queryClient = useQueryClient();

  // Consulta para buscar clientes com revisões
  const { 
    data, 
    isLoading, 
    error,
    refetch: refetchClientsQuery
  } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: fetchClientsWithReviews,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: attempt => Math.min(attempt * 1000, 30000),
  });

  // Extrair dados da consulta
  const clientsWithReviews = data?.clientsData;
  const lastReviewTime = data?.lastReviewTime;

  // Mutação para analisar um único cliente
  const reviewClientMutation = useMutation({
    mutationFn: (clientId: string) => analyzeClient(clientId, clientsWithReviews),
    onSuccess: () => {
      // Atualizar dados após análise bem-sucedida
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    },
  });

  // Mutação para analisar todos os clientes elegíveis
  const reviewAllClientsMutation = useMutation({
    mutationFn: () => {
      if (!clientsWithReviews) {
        return Promise.reject("Nenhum cliente disponível para análise");
      }
      
      // Filtrar apenas clientes com ID de conta Meta
      const eligibleClients = clientsWithReviews.filter(client => !!client.meta_account_id);
      setTotalClientsToAnalyze(eligibleClients.length);
      setBatchProgress(0);
      
      return analyzeAllClients(
        eligibleClients,
        // Callback quando inicia o processamento de um cliente
        (clientId) => {
          setProcessingClients(prev => [...prev, clientId]);
        },
        // Callback quando termina o processamento de um cliente
        (clientId) => {
          setProcessingClients(prev => prev.filter(id => id !== clientId));
          setBatchProgress(prev => prev + 1);
        }
      );
    },
    onSuccess: () => {
      // Atualizar dados após análise bem-sucedida
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    },
    onError: () => {
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  });

  // Função para iniciar análise de um cliente individual
  const reviewSingleClient = useCallback((clientId: string) => {
    // Adicionar cliente à lista de processamento
    setProcessingClients(prev => [...prev, clientId]);
    
    reviewClientMutation.mutate(clientId, {
      onSettled: () => {
        // Remover cliente da lista de processamento ao finalizar
        setProcessingClients(prev => prev.filter(id => id !== clientId));
      },
    });
  }, [reviewClientMutation]);

  // Função para iniciar análise em lote de todos os clientes
  const reviewAllClients = useCallback(() => {
    setIsBatchAnalyzing(true);
    reviewAllClientsMutation.mutate();
  }, [reviewAllClientsMutation]);

  // Função para recarregar os clientes
  const refetchClients = useCallback(() => {
    console.log("Recarregando dados de clientes...");
    return refetchClientsQuery();
  }, [refetchClientsQuery]);

  // Limpar estados ao desmontar o componente
  useEffect(() => {
    return () => {
      setProcessingClients([]);
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    };
  }, []);

  return {
    clientsWithReviews,
    isLoading,
    error,
    processingClients,
    isBatchAnalyzing,
    reviewSingleClient,
    reviewAllClients,
    lastReviewTime,
    refetchClients,
    batchProgress,
    totalClientsToAnalyze
  };
};
