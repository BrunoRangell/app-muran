import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { clientProcessingService } from "./services/clientProcessingService";
import { googleAdsClientReviewService } from "./services/googleAdsClientReviewService";
import { processingStateService } from "./services/processingStateService";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";

export const useGoogleAdsBatchReview = () => {
  const [isProcessingAll, setIsProcessingAll] = useState(false);
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

  // Mutation para analisar um lote de clientes Google Ads
  const analyzeAllMutation = useMutation({
    mutationFn: async () => {
      if (!googleAdsClients) return;

      setIsProcessingAll(true);

      // Obter o estado de processamento atual
      let processingState = await processingStateService.getProcessingState();
      if (!processingState) {
        // Se não existir, crie um novo estado
        processingState = await processingStateService.createProcessingState();
      }

      try {
        for (const client of googleAdsClients) {
          // Verificar se o cliente já está sendo processado
          if (await clientProcessingService.isClientProcessing(client.id)) {
            console.warn(`Cliente ${client.company_name} já está sendo processado. Ignorando.`);
            continue;
          }

          // Marcar o cliente como processando
          await clientProcessingService.markClientAsProcessing(client.id);

          try {
            // Executar a análise do cliente Google Ads
            await googleAdsClientReviewService.reviewClient(client.id);
          } catch (googleAdsReviewError) {
            console.error(`Erro ao analisar cliente ${client.company_name}:`, googleAdsReviewError);
            toast({
              title: "Erro ao analisar cliente",
              description: `Ocorreu um erro ao analisar o cliente ${client.company_name}.`,
              variant: "destructive",
            });
          } finally {
            // Marcar o cliente como não processando, independentemente do resultado
            await clientProcessingService.unmarkClientAsProcessing(client.id);
          }
        }

        // Após concluir a análise de todos os clientes, atualizar o timestamp
        await processingStateService.updateLastGoogleAdsReviewTime();
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
        // Invalidate queries para atualizar os dados
        queryClient.invalidateQueries(["google-ads-clients"]);
        queryClient.invalidateQueries(["processing-state"]);
      }
    },
  });

  // Função para disparar a análise em lote
  const handleAnalyzeAll = () => {
    analyzeAllMutation.mutate();
  };

  // Hook para buscar o estado de processamento
  const { data: processingState, isLoading: isProcessingStateLoading } = useQuery({
    queryKey: ["processing-state"],
    queryFn: processingStateService.getProcessingState,
  });

  // Formatar a data da última revisão em lote
  const lastBatchReviewTime = processingState?.last_google_ads_review_time
    ? formatDateInBrasiliaTz(processingState.last_google_ads_review_time, "dd/MM/yyyy HH:mm")
    : null;

  return {
    googleAdsClients,
    isLoading,
    isProcessingAll,
    lastBatchReviewTime,
    isProcessingStateLoading,
    handleAnalyzeAll,
  };
};
