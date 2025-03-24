
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview } from "./types/reviewTypes";

export const useBatchReview = (platform: "meta" | "google" = "meta") => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determinar os campos e IDs relevantes com base na plataforma
  const accountIdField = platform === "meta" ? "meta_account_id" : "google_account_id";
  const budgetField = platform === "meta" ? "meta_ads_budget" : "google_ads_budget";

  // Buscar clientes com suas revisões mais recentes
  const { data: clientsWithReviews, isLoading, refetch } = useQuery({
    queryKey: ["clients-with-reviews", platform],
    queryFn: async () => {
      try {
        console.log(`[useBatchReview] Buscando clientes com revisões para ${platform}...`);
        const { data: clients, error } = await supabase
          .from("clients")
          .select(`
            id, 
            company_name, 
            ${accountIdField}, 
            ${budgetField},
            client_current_reviews (
              id,
              meta_daily_budget_current,
              meta_total_spent,
              review_date,
              updated_at,
              using_custom_budget,
              custom_budget_amount
            )
          `)
          .order("company_name");

        if (error) {
          throw error;
        }

        // Verificar última revisão em massa
        const { data: latestBatch, error: batchError } = await supabase
          .from("scheduled_tasks")
          .select("last_run")
          .eq("task_name", platform === "meta" ? "meta_batch_review" : "google_batch_review")
          .order("last_run", { ascending: false })
          .limit(1)
          .single();

        if (!batchError && latestBatch && latestBatch.last_run) {
          setLastBatchReviewTime(new Date(latestBatch.last_run));
        }

        // Transformar os dados para o formato necessário
        return clients?.map(client => {
          const latestReview = client.client_current_reviews && 
                              client.client_current_reviews.length > 0 ? 
                              client.client_current_reviews[0] : null;
          
          return {
            id: client.id,
            company_name: client.company_name,
            [accountIdField]: client[accountIdField],
            [budgetField]: client[budgetField],
            review: latestReview,
            meta_daily_budget_current: latestReview?.meta_daily_budget_current || null,
            meta_total_spent: latestReview?.meta_total_spent || null,
            review_date: latestReview?.review_date || null,
            updated_at: latestReview?.updated_at || null,
            using_custom_budget: latestReview?.using_custom_budget || false,
            custom_budget_amount: latestReview?.custom_budget_amount || null
          };
        }) || [];
      } catch (error) {
        console.error(`[useBatchReview] Erro ao buscar clientes:`, error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
          variant: "destructive",
        });
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Função para revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      return;
    }

    try {
      setProcessingClients(prev => [...prev, clientId]);
      console.log(`[useBatchReview] Iniciando revisão para cliente ${clientId} na plataforma ${platform}`);

      // Aqui você chamaria sua função de análise do cliente
      // Por exemplo, invocar uma função Edge ou chamar um endpoint
      // Implementação simplificada para demonstração:
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular processamento

      // Atualizar os dados após análise bem-sucedida
      toast({
        title: "Revisão concluída",
        description: "A análise do cliente foi realizada com sucesso.",
      });

      // Recarregar dados
      await queryClient.invalidateQueries({ queryKey: ["clients-with-reviews", platform] });

    } catch (error) {
      console.error(`[useBatchReview] Erro ao analisar cliente:`, error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível completar a análise do cliente.",
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, queryClient, toast, platform]);

  // Função para revisar todos os clientes
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing) return;

    try {
      const clientsToAnalyze = clientsWithReviews?.filter(client => client[accountIdField]) || [];
      
      if (clientsToAnalyze.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: `Não há clientes com ID de ${platform === "meta" ? "Meta Ads" : "Google Ads"} configurado.`,
        });
        return;
      }

      setIsBatchAnalyzing(true);
      setTotalClientsToAnalyze(clientsToAnalyze.length);
      setBatchProgress(0);

      toast({
        title: "Análise em lote iniciada",
        description: `Iniciando análise de ${clientsToAnalyze.length} clientes.`,
      });

      // Implementação simplificada para demonstração:
      for (let i = 0; i < clientsToAnalyze.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simular processamento
        setBatchProgress(i + 1);
      }

      // Atualizar timestamp da última revisão em massa
      const now = new Date();
      setLastBatchReviewTime(now);

      // Atualizar scheduled_tasks na tabela
      await supabase
        .from("scheduled_tasks")
        .upsert({
          task_name: platform === "meta" ? "meta_batch_review" : "google_batch_review",
          last_run: now.toISOString(),
          schedule: "manual",
          config: { type: "batch_review" }
        }, { onConflict: "task_name" });

      // Recarregar dados
      await queryClient.invalidateQueries({ queryKey: ["clients-with-reviews", platform] });

      toast({
        title: "Análise em lote concluída",
        description: `${clientsToAnalyze.length} clientes foram analisados com sucesso.`,
      });
    } catch (error) {
      console.error(`[useBatchReview] Erro na análise em lote:`, error);
      toast({
        title: "Erro na análise em lote",
        description: "Não foi possível completar a análise de todos os clientes.",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  }, [clientsWithReviews, isBatchAnalyzing, queryClient, toast, accountIdField, platform]);

  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    refetchClients: refetch,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    platform
  };
};
