
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "./types/reviewTypes";
import { useToast } from "@/components/ui/use-toast";
import { fetchClientsWithGoogleReviews, reviewGoogleClient } from "./services/googleAdsClientReviewService";

/**
 * Hook para gerenciar revisões em lote para Google Ads
 */
export const useGoogleAdsBatchReview = () => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar clientes com suas revisões mais recentes
  const { 
    data: clientsWithReviews,
    isLoading,
    refetch: refetchClients
  } = useQuery({
    queryKey: ["clients-with-google-reviews"],
    queryFn: fetchClientsWithGoogleReviews,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar a data da última revisão em lote
  useEffect(() => {
    const fetchLastBatchTime = async () => {
      try {
        const { data, error } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "last_google_ads_batch_review")
          .single();

        if (error) {
          console.log("Sem registro de última revisão em lote para Google Ads");
          return;
        }

        if (data?.value?.timestamp) {
          setLastBatchReviewTime(new Date(data.value.timestamp));
        }
      } catch (err) {
        console.error("Erro ao buscar última revisão em lote:", err);
      }
    };

    fetchLastBatchTime();
  }, []);

  // Função para atualizar a data da última revisão em lote
  const updateLastBatchTime = useCallback(async () => {
    const now = new Date();
    
    try {
      const { data, error } = await supabase
        .from("system_configs")
        .upsert({
          key: "last_google_ads_batch_review",
          value: { timestamp: now.toISOString() }
        })
        .select();

      if (error) {
        console.error("Erro ao atualizar última revisão em lote:", error);
        return;
      }

      setLastBatchReviewTime(now);
    } catch (err) {
      console.error("Erro ao atualizar última revisão em lote:", err);
    }
  }, []);

  // Função para revisar um único cliente
  const reviewSingleClient = useCallback(async (clientId: string) => {
    // Evitar revisão duplicada
    if (processingClients.includes(clientId)) {
      return;
    }

    setProcessingClients(prev => [...prev, clientId]);
    
    try {
      // Buscar o cliente que está sendo processado
      const client = clientsWithReviews?.find(c => c.id === clientId);
      
      if (!client) {
        throw new Error("Cliente não encontrado");
      }
      
      // Verificar se o cliente tem ID Google Ads
      if (!client.google_account_id) {
        throw new Error("Cliente não possui ID Google Ads");
      }
      
      // Executar revisão
      await reviewGoogleClient(client);
      
      // Notificar sucesso
      toast({
        title: "Revisão concluída",
        description: `Revisão do cliente ${client.company_name} realizada com sucesso.`,
        duration: 3000,
      });
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ["clients-with-google-reviews"] });
    } catch (error) {
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      
      toast({
        title: "Erro na revisão",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao revisar o cliente.",
        variant: "destructive",
      });
    } finally {
      setProcessingClients(prev => prev.filter(id => id !== clientId));
    }
  }, [processingClients, clientsWithReviews, toast, queryClient]);

  // Função para revisar todos os clientes
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing || !clientsWithReviews) {
      return;
    }

    const clientsWithGoogleAds = clientsWithReviews.filter(
      client => client.google_account_id
    );

    if (clientsWithGoogleAds.length === 0) {
      toast({
        title: "Nenhum cliente a analisar",
        description: "Não há clientes com ID Google Ads configurado.",
        variant: "destructive",
      });
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(clientsWithGoogleAds.length);

    try {
      // Processar clientes em série para evitar sobrecarga
      for (let i = 0; i < clientsWithGoogleAds.length; i++) {
        const client = clientsWithGoogleAds[i];
        setProcessingClients(prev => [...prev, client.id]);

        try {
          await reviewGoogleClient(client);
          console.log(`Cliente ${client.company_name} analisado com sucesso`);
        } catch (error) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
        } finally {
          setProcessingClients(prev => prev.filter(id => id !== client.id));
          setBatchProgress(i + 1);
        }
      }

      // Atualizar timestamp da última revisão em lote
      await updateLastBatchTime();
      
      // Atualizar dados após conclusão
      queryClient.invalidateQueries({ queryKey: ["clients-with-google-reviews"] });

      toast({
        title: "Análise em lote concluída",
        description: `${clientsWithGoogleAds.length} clientes foram analisados com sucesso.`,
      });
    } catch (error) {
      console.error("Erro na análise em lote:", error);
      
      toast({
        title: "Erro na análise em lote",
        description: "Ocorreu um erro durante a análise em lote dos clientes.",
        variant: "destructive",
      });
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress(0);
      setTotalClientsToAnalyze(0);
    }
  }, [isBatchAnalyzing, clientsWithReviews, toast, queryClient, updateLastBatchTime]);

  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    refetchClients,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze
  };
};
