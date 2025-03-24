
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export const useBatchReview = (platform: 'meta' | 'google' = 'meta') => {
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [lastBatchReviewTime, setLastBatchReviewTime] = useState<Date | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalClientsToAnalyze, setTotalClientsToAnalyze] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Campo de ID da conta apropriado com base na plataforma
  const accountIdField = platform === 'meta' ? 'meta_account_id' : 'google_account_id';
  const platformName = platform === 'meta' ? 'Meta Ads' : 'Google Ads';

  // Obter clientes com revisões
  const { data: clientsWithReviews, isLoading, refetch } = useQuery({
    queryKey: ["clients-with-reviews", platform],
    queryFn: async () => {
      // Obter todos os clientes
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("company_name");

      if (clientsError) throw clientsError;

      // Obter a revisão mais recente para cada cliente
      const promises = clients.map(async (client) => {
        const { data: reviews, error: reviewError } = await supabase
          .from("daily_budget_reviews")
          .select("*")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (reviewError) {
          console.error("Erro ao buscar revisão:", reviewError);
          return client;
        }

        // Anexar a revisão mais recente ao cliente
        return { ...client, latestReview: reviews.length > 0 ? reviews[0] : null };
      });

      const clientsWithLatestReviews = await Promise.all(promises);
      return clientsWithLatestReviews;
    },
  });

  // Buscar o horário da última revisão em massa
  useEffect(() => {
    const fetchLastBatchReviewTime = async () => {
      const { data, error } = await supabase
        .from("meta_batch_reviews")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar última revisão em massa:", error);
        return;
      }

      if (data && data.length > 0) {
        setLastBatchReviewTime(new Date(data[0].created_at));
      }
    };

    fetchLastBatchReviewTime();
  }, []);

  // Mutação para revisar um único cliente
  const reviewMutation = useMutation({
    mutationFn: async (clientId: string) => {
      // Verificar se o cliente tem ID da conta configurado
      const client = clientsWithReviews?.find((c) => c.id === clientId);
      if (!client || !client[accountIdField]) {
        throw new Error(`Cliente não tem ${platformName} configurado`);
      }

      setProcessingClients((current) => [...current, clientId]);

      const { data, error } = await supabase.functions.invoke(
        "meta-budget-calculator",
        {
          body: { 
            clientId,
            platform
          },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data, clientId) => {
      console.log("Revisão concluída com sucesso:", data);
      
      // Remover cliente da lista de processamento
      setProcessingClients((current) =>
        current.filter((id) => id !== clientId)
      );
      
      // Atualizar dados
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["client-review", clientId] });
      
      toast({
        title: "Revisão concluída",
        description: `A revisão do cliente foi concluída com sucesso.`,
      });
    },
    onError: (error, clientId) => {
      console.error("Erro na revisão:", error);
      
      // Remover cliente da lista de processamento
      setProcessingClients((current) =>
        current.filter((id) => id !== clientId)
      );
      
      toast({
        title: "Erro na revisão",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a revisão.",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar um registro de revisão em massa
  const createBatchReviewMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("meta_batch_reviews")
        .insert([{ created_at: new Date().toISOString() }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log("Registro de revisão em massa criado:", data);
      setLastBatchReviewTime(new Date(data[0].created_at));
    },
    onError: (error) => {
      console.error("Erro ao criar registro de revisão em massa:", error);
    },
  });

  // Função para revisar um cliente
  const reviewSingleClient = useCallback(
    (clientId: string) => {
      reviewMutation.mutate(clientId);
    },
    [reviewMutation]
  );

  // Função para revisar todos os clientes
  const reviewAllClients = useCallback(async () => {
    if (isBatchAnalyzing) return;
    if (!clientsWithReviews) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
      return;
    }

    // Filtrar clientes com ID de conta configurado
    const clientsToAnalyze = clientsWithReviews.filter(
      (client) => client[accountIdField]
    );

    if (clientsToAnalyze.length === 0) {
      toast({
        title: "Nenhum cliente para revisar",
        description: `Não há clientes com ${platformName} configurado.`,
      });
      return;
    }

    setIsBatchAnalyzing(true);
    setBatchProgress(0);
    setTotalClientsToAnalyze(clientsToAnalyze.length);

    // Criar registro de revisão em massa
    await createBatchReviewMutation.mutateAsync();

    // Processar cada cliente sequencialmente para evitar sobrecarga
    for (let i = 0; i < clientsToAnalyze.length; i++) {
      const client = clientsToAnalyze[i];
      try {
        await reviewMutation.mutateAsync(client.id);
        setBatchProgress(i + 1);
      } catch (error) {
        console.error(`Erro ao revisar cliente ${client.company_name}:`, error);
        // Continua com o próximo cliente mesmo em caso de erro
      }
    }

    setIsBatchAnalyzing(false);
    toast({
      title: "Revisão em massa concluída",
      description: `Foram analisados ${clientsToAnalyze.length} clientes.`,
    });
  }, [clientsWithReviews, isBatchAnalyzing, accountIdField, createBatchReviewMutation, reviewMutation, toast, platformName]);

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
    totalClientsToAnalyze
  };
};
