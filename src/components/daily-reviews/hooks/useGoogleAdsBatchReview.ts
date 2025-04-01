
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchClientsWithGoogleReviews, reviewGoogleClient } from "./services/googleAdsClientReviewService";
import { splitClientsByGoogleAdsId } from "../dashboard/utils/clientSorting";
import { ClientWithReview } from "./types/reviewTypes";
import { supabase } from "@/lib/supabase";

export const useGoogleAdsBatchReview = () => {
  const [isReviewingBatch, setIsReviewingBatch] = useState(false);
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [lastBatchReviewDate, setLastBatchReviewDate] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar clientes e suas revisões mais recentes
  const { data: clients = [], isLoading, error, refetch } = useQuery({
    queryKey: ["google-ads-clients-with-reviews"],
    queryFn: fetchClientsWithGoogleReviews,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Separar clientes em dois grupos: com e sem ID Google Ads
  const { clientsWithGoogleAdsId, clientsWithoutGoogleAdsId } = splitClientsByGoogleAdsId(clients);

  // Testar tokens Google Ads
  const testGoogleAdsTokens = async () => {
    try {
      // Invocar edge function para verificar tokens
      const { data, error } = await supabase.functions.invoke('google-ads-token-check');
      
      if (error) {
        console.error("Erro ao verificar tokens:", error);
        throw new Error(`Erro ao verificar tokens: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao testar tokens:", error);
      throw error;
    }
  };

  // Realizar revisão para um único cliente
  const reviewClient = async (clientId: string) => {
    try {
      // Encontrar o cliente pelo ID
      const client = clients.find((c) => c.id === clientId);
      if (!client) {
        throw new Error("Cliente não encontrado");
      }

      // Adicionar o cliente à lista de processamento
      setProcessingClients((prev) => [...prev, clientId]);

      // Verificar tokens antes de prosseguir
      await testGoogleAdsTokens();

      // Realizar a revisão
      await reviewGoogleClient(client);

      // Atualizar o cache do React Query
      await queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });

      // Mostrar toast de sucesso
      toast({
        title: "Análise concluída",
        description: `Orçamento do cliente ${client.company_name} analisado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao revisar cliente:", error);
      toast({
        title: "Erro na análise",
        description: `Não foi possível analisar o cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      });
    } finally {
      // Remover o cliente da lista de processamento
      setProcessingClients((prev) => prev.filter((id) => id !== clientId));
    }
  };

  // Realizar revisão em lote para todos os clientes com ID Google Ads
  const reviewAllClients = async () => {
    if (isReviewingBatch || clientsWithGoogleAdsId.length === 0) return;

    try {
      setIsReviewingBatch(true);
      
      // Inicializar lista de clientes em processamento com todos os clientes que têm ID Google Ads
      const clientIds = clientsWithGoogleAdsId.map((c) => c.id);
      setProcessingClients(clientIds);

      // Verificar tokens antes de prosseguir
      await testGoogleAdsTokens();

      // Registrar a data/hora da revisão em lote
      setLastBatchReviewDate(new Date().toISOString());

      // Contador para acompanhar o progresso
      let successCount = 0;
      let errorCount = 0;

      // Processar um cliente de cada vez para não sobrecarregar o servidor
      for (const client of clientsWithGoogleAdsId) {
        try {
          // Verificar se o cliente tem ID Google Ads
          if (!client.google_account_id) {
            errorCount++;
            // Remover da lista de processamento se não tiver ID
            setProcessingClients((prev) => prev.filter((id) => id !== client.id));
            continue;
          }

          // Realizar a revisão para este cliente
          await reviewGoogleClient(client);
          successCount++;

          // Remover o cliente da lista de processamento
          setProcessingClients((prev) => prev.filter((id) => id !== client.id));
        } catch (error) {
          console.error(`Erro ao revisar cliente ${client.company_name}:`, error);
          errorCount++;
          // Remover o cliente da lista de processamento mesmo em caso de erro
          setProcessingClients((prev) => prev.filter((id) => id !== client.id));
        }
      }

      // Atualizar o cache do React Query
      await queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });

      // Mostrar toast com o resumo
      toast({
        title: "Revisão em lote concluída",
        description: `${successCount} clientes analisados com sucesso. ${errorCount} falhas.`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao iniciar revisão em lote:", error);
      toast({
        title: "Erro na revisão em lote",
        description: "Não foi possível iniciar a revisão em lote",
        variant: "destructive",
      });
    } finally {
      setIsReviewingBatch(false);
      setProcessingClients([]);
    }
  };

  return {
    clients,
    clientsWithGoogleAdsId,
    clientsWithoutGoogleAdsId,
    isLoading,
    error,
    refetch,
    reviewClient,
    reviewAllClients,
    isReviewingBatch,
    processingClients,
    lastBatchReviewDate,
    testGoogleAdsTokens
  };
};
