
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { fetchClientsWithReviews } from "./services/clientReviewService";
import { analyzeClient, analyzeAllClients } from "./services/clientAnalysisService";

export const useBatchReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para controlar quais clientes estão sendo processados
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [lastReviewTime, setLastReviewTime] = useState<Date | null>(null);
  const [reviewInProgress, setReviewInProgress] = useState(false);

  // Buscar clientes ativos com informações de revisão
  const { data: clientsWithReviews, isLoading, refetch } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: async () => {
      const { clientsData, lastReviewTime: reviewTime } = await fetchClientsWithReviews();
      setLastReviewTime(reviewTime);
      console.log("Clientes com revisões carregados:", clientsData?.length);
      return clientsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Mutation para realizar a análise de um cliente
  const analyzeClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      setProcessingClients(prev => [...prev, clientId]);
      
      try {
        return await analyzeClient(clientId, clientsWithReviews);
      } catch (error) {
        console.error(`Erro ao analisar cliente ${clientId}:`, error);
        throw error;
      } finally {
        setProcessingClients(prev => prev.filter(id => id !== clientId));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    }
  });

  // Mutation para revisar todos os clientes em sequência
  const reviewAllClientsMutation = useMutation({
    mutationFn: async (): Promise<BatchReviewResult> => {
      setReviewInProgress(true);
      
      try {
        const result = await analyzeAllClients(
          clientsWithReviews,
          // Callbacks para atualizar o estado de processamento
          (clientId) => setProcessingClients(prev => [...prev, clientId]),
          (clientId) => setProcessingClients(prev => prev.filter(id => id !== clientId))
        );
        
        setLastReviewTime(new Date());
        return result;
      } finally {
        setReviewInProgress(false);
      }
    },
    onSuccess: (data) => {
      const { results, errors } = data;
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      
      if (errors.length === 0) {
        toast({
          title: "Revisão completa",
          description: `${results.length} clientes foram analisados com sucesso.`,
        });
      } else {
        toast({
          title: "Revisão parcialmente completa",
          description: `${results.length} clientes analisados, ${errors.length} com erros.`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na revisão",
        description: error instanceof Error ? error.message : "Erro inesperado durante a revisão em massa",
        variant: "destructive",
      });
    }
  });

  // Função para revisar apenas um cliente específico
  const reviewSingleClient = (clientId: string) => {
    analyzeClientMutation.mutate(clientId, {
      onSuccess: () => {
        toast({
          title: "Revisão concluída",
          description: "Cliente analisado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      },
      onError: (error) => {
        toast({
          title: "Erro na revisão",
          description: error instanceof Error ? error.message : "Erro ao analisar cliente",
          variant: "destructive",
        });
      }
    });
  };

  // Função para revisar todos os clientes
  const reviewAllClients = () => {
    reviewAllClientsMutation.mutate();
  };

  console.log("Estado atual do hook useBatchReview:", {
    clientsCarregados: clientsWithReviews?.length || 0,
    isLoading,
    clientesEmProcessamento: processingClients.length,
    ultimaRevisao: lastReviewTime
  });

  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewInProgress,
    lastReviewTime,
    reviewSingleClient,
    reviewAllClients,
    refetchClients: refetch,
    isAnalyzing: analyzeClientMutation.isPending,
    isBatchAnalyzing: reviewAllClientsMutation.isPending
  };
};
