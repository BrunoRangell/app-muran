
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
  const [batchProgress, setBatchProgress] = useState(0);
  
  // Buscar a lista de clientes e suas revisões mais recentes
  const { 
    data: clientsData = { clientsData: [], lastReviewTime: null }, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['clients-with-reviews'],
    queryFn: fetchClientsWithReviews,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Extrair os arrays de clientes do resultado
  const clientsWithReviews: ClientWithReview[] = Array.isArray(clientsData) 
    ? clientsData 
    : (clientsData?.clientsData || []);
  
  // Buscar o horário da última revisão em massa REAL do system_logs
  const { data: lastBatchInfo, refetch: refetchBatchInfo } = useQuery({
    queryKey: ['last-batch-review-real'],
    queryFn: async () => {
      console.log("🔍 Buscando última revisão em massa real do system_logs...");
      
      const { data } = await supabase
        .from('system_logs')
        .select('created_at, message, details')
        .eq('event_type', 'batch_review_completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log("📅 Última revisão em massa encontrada:", data);
      
      return data ? {
        lastBatchReviewTime: data.created_at,
        details: data.details
      } : null;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos
  });
  
  // Atualizar o estado local quando os dados chegarem
  useEffect(() => {
    if (lastBatchInfo?.lastBatchReviewTime) {
      setLastBatchReviewTime(lastBatchInfo.lastBatchReviewTime);
    }
  }, [lastBatchInfo]);
  
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
      
      // Invalidar as consultas para recarregar os dados
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
      console.log("🚀 Iniciando revisão em massa...");
      
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
      setBatchProgress(0);
      
      let successCount = 0;
      let errorCount = 0;
      
      console.log(`📊 Processando ${eligibleClients.length} clientes elegíveis...`);
      
      // Processar cada cliente em sequência
      for (const client of eligibleClients) {
        try {
          console.log(`⚡ Processando cliente: ${client.company_name}`);
          startProcessingClient(client.id);
          await analyzeClient(client.id, clientsWithReviews);
          successCount++;
          setBatchProgress(prev => prev + 1);
          console.log(`✅ Cliente ${client.company_name} processado com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao analisar cliente ${client.company_name}:`, error);
          errorCount++;
          setBatchProgress(prev => prev + 1);
        } finally {
          finishProcessingClient(client.id);
        }
      }
      
      // IMPORTANTE: Só registrar no system_logs APÓS todas as revisões serem concluídas
      const now = getCurrentDateInBrasiliaTz().toISOString();
      
      console.log(`📝 Registrando conclusão da revisão em massa: ${successCount} sucessos, ${errorCount} erros`);
      
      const { data: logData, error: logError } = await supabase
        .from('system_logs')
        .insert({
          event_type: 'batch_review_completed',
          message: `Revisão em lote concluída: ${successCount} sucesso(s), ${errorCount} erro(s)`,
          details: { 
            successCount, 
            errorCount, 
            totalClients: eligibleClients.length,
            completedAt: now
          }
        })
        .select()
        .single();
      
      if (logError) {
        console.error("❌ Erro ao registrar log:", logError);
      } else {
        console.log("✅ Log de conclusão registrado:", logData);
        
        // Só atualizar o estado local APÓS confirmar que o log foi salvo
        setLastBatchReviewTime(now);
        
        // Invalidar a query para buscar os dados atualizados
        refetchBatchInfo();
      }
      
      // Recarregar dados dos clientes
      queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
      
      toast({
        title: "Revisão em lote concluída",
        description: `${successCount} cliente(s) analisado(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
      
    } catch (error) {
      console.error("❌ Erro na revisão em lote:", error);
      
      toast({
        title: "Erro na revisão em lote",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  }, [clientsWithReviews, isBatchAnalyzing, startProcessingClient, finishProcessingClient, toast, queryClient, refetchBatchInfo]);
  
  return {
    clientsWithReviews,
    isLoading,
    error,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    refetchClients: refetch
  };
};
