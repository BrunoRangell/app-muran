
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { googleAdsClientReviewService } from "./services/googleAdsClientReviewService";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

export const useGoogleAdsBatchReview = () => {
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os clientes Google Ads
  const { data: googleAdsClients, isLoading } = useQuery({
    queryKey: ["google-ads-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("platform", "google")
        .order("company_name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar clientes Google Ads:", error);
        throw error;
      }
      return data;
    },
  });

  // Função para revisar todos os clientes
  const reviewAllClients = async () => {
    if (!googleAdsClients || isProcessingAll) return;

    setIsProcessingAll(true);
    setProcessingClients([]);

    try {
      for (const client of googleAdsClients) {
        setProcessingClients(prev => [...prev, client.id]);

        try {
          await googleAdsClientReviewService.reviewClient(client.id);
        } catch (error) {
          console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
          toast({
            title: "Erro ao analisar cliente",
            description: `Ocorreu um erro ao analisar o cliente ${client.company_name}.`,
            variant: "destructive",
          });
        } finally {
          setProcessingClients(prev => prev.filter(id => id !== client.id));
        }
      }

      console.log("Análise em lote de clientes Google Ads concluída com sucesso.");
      toast({
        title: "Análise em lote concluída",
        description: "A análise em lote de clientes Google Ads foi concluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro durante a análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: "Ocorreu um erro durante a análise em lote de clientes Google Ads.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAll(false);
      setProcessingClients([]);
      queryClient.invalidateQueries({ queryKey: ["google-ads-clients"] });
    }
  };

  // Buscar o estado de processamento
  const { data: processingState } = useQuery({
    queryKey: ["processing-state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_configs")
        .select("*")
        .eq("key", "last_google_ads_review_time")
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar estado de processamento:", error);
        throw error;
      }
      return data;
    },
  });

  // Formatar a data da última revisão em lote
  const lastBatchReviewTime = processingState?.value
    ? formatDateInBrasiliaTz(new Date(processingState.value as string), "dd/MM/yyyy HH:mm")
    : null;

  const clientsWithGoogleAdsId = googleAdsClients?.filter(client => client.google_account_id) || [];

  return {
    googleAdsClients: googleAdsClients || [],
    isLoading,
    isProcessingAll,
    isReviewingBatch: isProcessingAll,
    processingClients,
    lastBatchReviewTime,
    lastBatchReviewDate: processingState?.value as string,
    clientsWithGoogleAdsId,
    reviewAllClients,
    handleAnalyzeAll: reviewAllClients,
  };
};
