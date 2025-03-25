
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClientWithReview, BatchReviewResult } from "./types/reviewTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { fetchGoogleAdsClientsWithReviews, analyzeGoogleAdsClient, analyzeAllGoogleAdsClients } from "./services/googleAdsClientReviewService";

export const useGoogleAdsBatchReview = () => {
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
    queryKey: ["google-ads-clients-with-reviews"],
    queryFn: fetchGoogleAdsClientsWithReviews,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Consulta para obter a data da última revisão em massa
  const { data: lastBatchReviewTimeData } = useQuery({
    queryKey: ["google-ads-last-batch-review-time"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "google_ads_last_batch_review_time")
        .single();
      
      if (error) {
        console.error("Erro ao buscar última data de revisão Google Ads:", error);
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
    console.log("Recarregando dados dos clientes (Google Ads)...");
    await refetch();
  }, [refetch]);

  // Função para salvar a data da última revisão em massa
  const saveLastBatchReviewTime = async (timestamp: Date) => {
    try {
      // Verificar se o registro já existe
      const { data: existingConfig, error: checkError } = await supabase
        .from("system_configs")
        .select("*")
        .eq("key", "google_ads_last_batch_review_time")
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Erro ao verificar config existente:", checkError);
        return;
      }
      
      if (existingConfig) {
        // Atualizar registro existente
        const { error } = await supabase
          .from("system_configs")
          .update({ value: timestamp.toISOString() })
          .eq("key", "google_ads_last_batch_review_time");
        
        if (error) {
          console.error("Erro ao atualizar data da última revisão Google Ads:", error);
          return;
        }
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from("system_configs")
          .insert({ key: "google_ads_last_batch_review_time", value: timestamp.toISOString() });
        
        if (error) {
          console.error("Erro ao inserir data da última revisão Google Ads:", error);
          return;
        }
      }
      
      console.log("Data da última revisão Google Ads salva com sucesso:", timestamp);
      // Invalidar a consulta para garantir que os dados sejam atualizados
      queryClient.invalidateQueries({ queryKey: ["google-ads-last-batch-review-time"] });
    } catch (error) {
      console.error("Erro ao salvar data da última revisão Google Ads:", error);
    }
  };

  // Função para revisar um único cliente - NÃO atualiza timestamp de revisão em massa
  const reviewSingleClient = useCallback(async (clientId: string) => {
    if (processingClients.includes(clientId)) {
      console.log(`Cliente ${clientId} já está em processamento (Google Ads).`);
      return;
    }

    try {
      setProcessingClients(prev => [...prev, clientId]);
      
      console.log(`Iniciando análise Google Ads para cliente ${clientId}`);
      const result = await analyzeGoogleAdsClient(clientId, clientsWithReviews);
      
      toast({
        title: "Análise concluída",
        description: "Orçamentos de Google Ads atualizados com sucesso!",
      });
      
      console.log("Análise Google Ads concluída com sucesso:", result);
      await refetchClients();
      
    } catch (error) {
      console.error("Erro ao analisar cliente (Google Ads):", error);
      
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido na análise do cliente.",
        variant: "destructive",
      });
      
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, clientsWithReviews, toast, refetchClients]);

  // Função para revisar todos os clientes - atualiza o timestamp de revisão em massa
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing) {
      console.log("Já existe uma análise em massa em andamento (Google Ads).");
      return;
    }

    if (!clientsWithReviews || clientsWithReviews.length === 0) {
      console.log("Nenhum cliente disponível para análise Google Ads.");
      toast({
        title: "Nenhum cliente disponível",
        description: "Não há clientes disponíveis para analisar no Google Ads.",
        variant: "destructive",
      });
      return;
    }

    // Filtrar apenas clientes com ID de conta Google Ads configurado
    const eligibleClients = clientsWithReviews.filter(client => 
      client.google_account_id && client.google_account_id.trim() !== ""
    );
    
    if (eligibleClients.length === 0) {
      toast({
        title: "Nenhum cliente elegível",
        description: "Nenhum cliente com conta Google Ads configurada.",
        variant: "destructive",
      });
      return;
    }
    
    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(eligibleClients.length);
    
    // Atualizar o timestamp da revisão em massa para agora
    const now = new Date();
    
    // Salvar a data da última revisão no Supabase
    await saveLastBatchReviewTime(now);

    try {
      console.log("Iniciando análise em massa Google Ads...");
      
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
      
      const result: BatchReviewResult = await analyzeAllGoogleAdsClients(
        clientsWithReviews,
        handleClientStart,
        handleClientEnd
      );
      
      console.log("Análise em massa Google Ads concluída:", result);
      
      const successCount = result.results.length;
      const errorCount = result.errors.length;
      
      if (successCount > 0 || errorCount > 0) {
        toast({
          title: "Análise em massa Google Ads concluída",
          description: `${successCount} análises concluídas com sucesso. ${errorCount} falhas.`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Nenhum cliente analisado",
          description: "Não foi possível analisar nenhum cliente no Google Ads.",
          variant: "destructive",
        });
      }
      
      await refetchClients();
      
    } catch (error) {
      console.error("Erro na análise em massa Google Ads:", error);
      
      toast({
        title: "Erro na análise em massa Google Ads",
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
    console.log("Clientes em processamento (Google Ads):", processingClients);
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
