
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { analyzeClient, fetchClientsWithReviews } from "./services/clientReviewService";
import { getCurrentDateInBrasiliaTz } from "../summary/utils";

/**
 * Hook para gerenciar revisões em lote de clientes
 */
export const useBatchReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<string | null>(null);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  
  // Buscar a lista de clientes e suas revisões mais recentes
  const { 
    data: clientsWithReviews = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: fetchClientsWithReviews,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Buscar o horário da última revisão em massa
  useEffect(() => {
    const fetchLastBatchReviewTime = async () => {
      const { data } = await supabase
        .from('system_logs')
        .select('created_at')
        .eq('event_type', 'batch_review_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLastBatchReviewTime(data.created_at);
      }
    };
    
    fetchLastBatchReviewTime();
  }, []);
  
  // Marcar que um cliente está sendo processado
  const startProcessingClient = useCallback((clientId: string) => {
    setProcessingClients(prev => [...prev, clientId]);
  }, []);
  
  // Marcar que um cliente terminou de ser processado
  const finishProcessingClient = useCallback((clientId: string) => {
    setProcessingClients(prev => prev.filter(id => id !== clientId));
  }, []);
  
  // Revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      toast({
        title: "Processamento em andamento",
        description: "Este cliente já está sendo analisado.",
        variant: "default",
      });
      return false;
    }
    
    try {
      startProcessingClient(clientId);
      
      await analyzeClient(clientId, clientsWithReviews);
      
      // Invalidar a consulta para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['latest-review', clientId] });
      
      toast({
        title: "Análise concluída",
        description: "Cliente analisado com sucesso.",
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      return false;
    } finally {
      finishProcessingClient(clientId);
    }
  }, [processingClients, startProcessingClient, finishProcessingClient, toast, clientsWithReviews, queryClient]);
  
  // Revisar todos os clientes elegíveis
  const reviewAllClients = useCallback(async () => {
    // Verificar se já existe uma revisão em lote em andamento
    if (isBatchAnalyzing) {
      toast({
        title: "Processamento em andamento",
        description: "Já existe uma análise em lote em andamento.",
        variant: "default",
      });
      return;
    }
    
    try {
      // Filtrar clientes elegíveis (com meta_account_id configurado)
      const eligibleClients = clientsWithReviews.filter(
        client => client.meta_account_id && client.meta_account_id.trim() !== ""
      );
      
      if (eligibleClients.length === 0) {
        toast({
          title: "Nenhum cliente elegível",
          description: "Não há clientes com ID de conta Meta configurado.",
          variant: "default",
        });
        return;
      }
      
      setIsBatchAnalyzing(true);
      setTotalClientsToAnalyze(eligibleClients.length);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Processar cada cliente em sequência
      for (const client of eligibleClients) {
        try {
          startProcessingClient(client.id);
          await analyzeClient(client.id, clientsWithReviews);
          successCount++;
        } catch (error) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
          errorCount++;
        } finally {
          finishProcessingClient(client.id);
        }
      }
      
      // Registrar conclusão da revisão em lote
      const now = getCurrentDateInBrasiliaTz().toISOString();
      setLastBatchReviewTime(now);
      
      await supabase.from('system_logs').insert({
        event_type: 'batch_review_completed',
        message: `Revisão em lote concluída: ${successCount} sucesso(s), ${errorCount} erro(s)`,
        details: { successCount, errorCount }
      });
      
      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
      
      toast({
        title: "Revisão em lote concluída",
        description: `${successCount} cliente(s) analisado(s) com sucesso. ${errorCount} erro(s).`,
      });
      
    } catch (error) {
      console.error("Erro na revisão em lote:", error);
      
      toast({
        title: "Erro na revisão em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
    }
  }, [clientsWithReviews, isBatchAnalyzing, startProcessingClient, finishProcessingClient, toast, queryClient]);
  
  return {
    clientsWithReviews,
    isLoading,
    error,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    totalClientsToAnalyze,
    refetchClients: refetch
  };
};
