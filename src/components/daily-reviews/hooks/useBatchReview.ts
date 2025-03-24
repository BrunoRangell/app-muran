
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

/**
 * Hook para gerenciar revisões em massa de orçamentos do Meta Ads
 */
export const useBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  // Progresso da análise em massa
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Consulta principal para obter clientes com revisões
  const { 
    data: clientsWithReviewsData,
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: async () => {
      try {
        console.log("Buscando clientes com revisões...");
        
        // Buscar todos os clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .order("company_name");
        
        if (clientsError) {
          throw clientsError;
        }
        
        // Buscar revisões atuais
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("client_current_reviews")
          .select("*");
        
        if (reviewsError) {
          throw reviewsError;
        }
        
        // Mapear revisões por cliente
        const reviewsByClientId = (reviewsData || []).reduce((acc, review) => {
          acc[review.client_id] = review;
          return acc;
        }, {});
        
        // Buscar orçamentos personalizados ativos
        const today = new Date().toISOString().split("T")[0];
        const { data: customBudgetsData, error: customBudgetsError } = await supabase
          .from("meta_custom_budgets")
          .select("*")
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today);
        
        if (customBudgetsError) {
          throw customBudgetsError;
        }
        
        // Mapear orçamentos personalizados por cliente
        const customBudgetsByClientId = (customBudgetsData || []).reduce((acc, budget) => {
          acc[budget.client_id] = budget;
          return acc;
        }, {});
        
        // Combinar os dados
        const clientsWithReviews = (clientsData || []).map(client => ({
          ...client,
          currentReview: reviewsByClientId[client.id] || null,
          customBudget: customBudgetsByClientId[client.id] || null
        }));
        
        return {
          clientsData: clientsWithReviews,
          reviewsData: reviewsData || [],
          customBudgetsData: customBudgetsData || []
        };
      } catch (error) {
        console.error("Erro ao buscar clientes com revisões:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Consulta para obter a data da última revisão em massa
  const { data: lastBatchReviewTimeData } = useQuery({
    queryKey: ["last-batch-review-time"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .single();
      
      if (error) {
        console.error("Erro ao buscar última data de revisão:", error);
        return null;
      }
      
      if (data && data.value !== "null") {
        const timestamp = data.value;
        return new Date(timestamp);
      }
      
      return null;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Estado da última revisão em massa derivado da query
  const lastBatchReviewTime = lastBatchReviewTimeData;
  
  const clientsWithReviews = clientsWithReviewsData?.clientsData;
  
  // Função para recarregar dados
  const refetchClients = useCallback(async () => {
    console.log("Recarregando dados dos clientes...");
    await refetch();
    // Também atualizar as consultas de revisões atuais
    queryClient.invalidateQueries({ queryKey: ["client-current-reviews"] });
  }, [refetch, queryClient]);

  // Função para salvar a data da última revisão em massa
  const saveLastBatchReviewTime = async (timestamp: Date) => {
    try {
      const { error } = await supabase
        .from("system_configs")
        .upsert({ 
          key: "last_batch_review_time", 
          value: timestamp.toISOString() 
        })
        .eq("key", "last_batch_review_time");
      
      if (error) {
        console.error("Erro ao salvar data da última revisão:", error);
      } else {
        console.log("Data da última revisão salva com sucesso:", timestamp);
        // Invalidar a consulta para garantir que os dados sejam atualizados
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-time"] });
      }
    } catch (error) {
      console.error("Erro ao salvar data da última revisão:", error);
    }
  };

  // Função para revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      console.log(`Cliente ${clientId} já está em processamento.`);
      return;
    }

    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      console.log(`Iniciando análise para cliente ${clientId}`);
      
      // Chamar função Edge para analisar cliente
      const { data, error } = await supabase.functions.invoke("daily-budget-reviews", {
        body: { method: "analyzeClient", clientId }
      });
      
      if (error) {
        throw new Error(`Erro ao analisar cliente: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.message || "Erro desconhecido na análise do cliente");
      }
      
      toast({
        title: "Análise concluída",
        description: "Orçamentos de Meta Ads atualizados com sucesso!",
      });
      
      console.log("Análise concluída com sucesso:", data);
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
  }, [processingClients, toast, refetchClients, supabase]);

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
    
    try {
      console.log("Iniciando análise em massa...");
      
      // Executar a função Edge para revisão em massa
      const { data, error } = await supabase.functions.invoke("scheduled-reviews", {
        body: { method: "force-run" }
      });
      
      if (error) {
        throw new Error(`Erro na análise em massa: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.message || "Erro desconhecido na análise em massa");
      }
      
      console.log("Resultado da análise em massa:", data);
      
      // Atualizar o timestamp da revisão em massa para agora
      const now = new Date();
      await saveLastBatchReviewTime(now);
      
      const results = data.results || [];
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Análise em massa concluída",
        description: `${successCount} análises concluídas com sucesso. ${errorCount} falhas.`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
      
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
  }, [isBatchAnalyzing, clientsWithReviews, toast, refetchClients, saveLastBatchReviewTime, supabase]);

  // Monitorar mudanças nos clientes em processamento
  useEffect(() => {
    console.log("Clientes em processamento:", processingClients);
  }, [processingClients]);

  return {
    clientsWithReviews,
    lastBatchReviewTime,
    isLoading,
    processingClients,
    isBatchAnalyzing,
    reviewSingleClient,
    reviewAllClients,
    refetchClients,
    // Informações de progresso
    batchProgress,
    totalClientsToAnalyze
  };
};
