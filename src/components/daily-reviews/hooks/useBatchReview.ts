
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEdgeFunction } from "./useEdgeFunction";

// Interface para cliente com dados de revisão
export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  lastReview?: {
    id: number;
    review_date: string;
    meta_daily_budget_current: number | null;
    meta_total_spent: number;
    idealDailyBudget?: number;
    recommendation?: string | null;
  };
}

export const useBatchReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getMetaAccessToken } = useEdgeFunction();
  
  // Estado para controlar quais clientes estão sendo processados
  const [processingClients, setProcessingClients] = useState<string[]>([]);
  const [lastReviewTime, setLastReviewTime] = useState<Date | null>(null);
  const [reviewInProgress, setReviewInProgress] = useState(false);

  // Buscar clientes ativos com informações de revisão
  const { data: clientsWithReviews, isLoading, refetch } = useQuery({
    queryKey: ["clients-with-reviews"],
    queryFn: async () => {
      // Buscar clientes ativos que tenham ID de conta Meta configurado
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name, meta_account_id, meta_ads_budget")
        .eq("status", "active")
        .not("meta_account_id", "is", null)
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Para cada cliente, buscar a revisão mais recente
      const clientsWithReviewsData = await Promise.all(
        clients.map(async (client) => {
          const { data: reviews, error: reviewsError } = await supabase
            .from("daily_budget_reviews")
            .select("*")
            .eq("client_id", client.id)
            .order("review_date", { ascending: false })
            .limit(1);

          if (reviewsError) {
            console.error(`Erro ao buscar revisões para cliente ${client.id}:`, reviewsError);
            return { ...client, lastReview: null };
          }

          // Processar a revisão mais recente para adicionar orçamento diário ideal e recomendação
          if (reviews && reviews.length > 0) {
            const review = reviews[0];
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const idealDailyBudget = client.meta_ads_budget / daysInMonth;
            
            // Gerar recomendação baseada na comparação entre orçamento atual e ideal
            let recommendation = null;
            if (review.meta_daily_budget_current) {
              const diff = review.meta_daily_budget_current - idealDailyBudget;
              const percentDiff = (diff / idealDailyBudget) * 100;
              
              if (percentDiff > 10) {
                recommendation = `Diminuir ${Math.round(percentDiff)}%`;
              } else if (percentDiff < -10) {
                recommendation = `Aumentar ${Math.round(Math.abs(percentDiff))}%`;
              } else {
                recommendation = "Manter";
              }
            }
            
            return { 
              ...client, 
              lastReview: {
                ...review,
                idealDailyBudget,
                recommendation
              }
            };
          }

          return { ...client, lastReview: null };
        })
      );

      // Encontrar a data da revisão mais recente
      const mostRecentReview = clientsWithReviewsData
        .filter(client => client.lastReview)
        .sort((a, b) => {
          if (!a.lastReview || !b.lastReview) return 0;
          return new Date(b.lastReview.review_date).getTime() - new Date(a.lastReview.review_date).getTime();
        })[0];

      if (mostRecentReview?.lastReview) {
        setLastReviewTime(new Date(mostRecentReview.lastReview.review_date));
      }

      return clientsWithReviewsData as ClientWithReview[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Mutation para realizar a análise de um cliente
  const analyzeClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      setProcessingClients(prev => [...prev, clientId]);
      
      try {
        const client = clientsWithReviews?.find(c => c.id === clientId);
        
        if (!client || !client.meta_account_id) {
          throw new Error("Cliente não encontrado ou sem ID de conta Meta");
        }
        
        console.log(`Analisando cliente: ${client.company_name} (${client.meta_account_id})`);
        
        // Obter token de acesso
        const accessToken = await getMetaAccessToken();
        
        if (!accessToken) {
          throw new Error("Token de acesso Meta não disponível");
        }
        
        // Chamar função de borda para calcular orçamento
        const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
          body: {
            accountId: client.meta_account_id,
            accessToken
          }
        });
        
        if (error) {
          console.error("Erro na função de borda:", error);
          throw new Error(`Erro ao analisar cliente: ${error.message}`);
        }
        
        if (!data) {
          throw new Error("Resposta vazia da API");
        }
        
        console.log("Dados recebidos da API:", data);
        
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Salvar os resultados no banco de dados como uma nova revisão diária
        const { data: reviewData, error: reviewError } = await supabase.rpc(
          "insert_daily_budget_review",
          {
            p_client_id: client.id,
            p_review_date: currentDate,
            p_meta_daily_budget_current: data.totalDailyBudget,
            p_meta_total_spent: data.totalSpent || 0,
            p_meta_account_id: client.meta_account_id,
            p_meta_account_name: `Conta ${client.meta_account_id}`
          }
        );
        
        if (reviewError) {
          console.error("Erro ao salvar revisão:", reviewError);
          throw new Error(`Erro ao salvar revisão: ${reviewError.message}`);
        }
        
        console.log("Revisão salva com sucesso:", reviewData);
        
        return {
          clientId,
          reviewId: reviewData,
          analysis: data
        };
      } catch (error) {
        console.error(`Erro ao analisar cliente ${clientId}:`, error);
        throw error;
      } finally {
        setProcessingClients(prev => prev.filter(id => id !== clientId));
      }
    },
    meta: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
      }
    }
  });

  // Mutation para revisar todos os clientes em sequência
  const reviewAllClientsMutation = useMutation({
    mutationFn: async () => {
      setReviewInProgress(true);
      const results = [];
      const errors = [];
      
      try {
        // Filtrar apenas clientes com ID de conta Meta configurado
        const eligibleClients = clientsWithReviews?.filter(client => 
          client.meta_account_id && client.meta_account_id.trim() !== ""
        ) || [];
        
        console.log(`Iniciando revisão em massa para ${eligibleClients.length} clientes`);
        
        // Processar clientes em sequência para evitar sobrecarga
        for (const client of eligibleClients) {
          try {
            setProcessingClients(prev => [...prev, client.id]);
            const result = await analyzeClientMutation.mutateAsync(client.id);
            results.push(result);
          } catch (error) {
            console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
            errors.push({
              clientId: client.id,
              clientName: client.company_name,
              error: error instanceof Error ? error.message : "Erro desconhecido"
            });
          } finally {
            setProcessingClients(prev => prev.filter(id => id !== client.id));
          }
        }
        
        setLastReviewTime(new Date());
        
        return { results, errors };
      } finally {
        setReviewInProgress(false);
      }
    },
    meta: {
      onSuccess: (data) => {
        const { results, errors } = data;
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        
        if (errors.length === 0) {
          toast({
            title: "Revisão completa",
            description: `${results.length} clientes foram analisados com sucesso.`,
          });
        } else {
          toast({
            title: "Revisão parcialmente completa",
            description: `${results.length} clientes analisados, ${errors.length} com erros.`,
            variant: "destructive",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Erro na revisão",
          description: error instanceof Error ? error.message : "Erro inesperado durante a revisão em massa",
          variant: "destructive",
        });
      }
    }
  });

  // Função para revisar apenas um cliente específico
  const reviewSingleClient = (clientId: string) => {
    analyzeClientMutation.mutate(clientId, {
      meta: {
        onSuccess: () => {
          toast({
            title: "Revisão concluída",
            description: "Cliente analisado com sucesso.",
          });
          queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        },
        onError: (error) => {
          toast({
            title: "Erro na revisão",
            description: error instanceof Error ? error.message : "Erro ao analisar cliente",
            variant: "destructive",
          });
        }
      }
    });
  };

  // Função para revisar todos os clientes
  const reviewAllClients = () => {
    reviewAllClientsMutation.mutate();
  };

  return {
    clientsWithReviews,
    isLoading,
    processingClients,
    reviewInProgress,
    lastReviewTime,
    reviewSingleClient,
    reviewAllClients,
    refetchClients: refetch,
    isAnalyzing: analyzeClientMutation.isPending,
    isBatchAnalyzing: reviewAllClientsMutation.isPending
  };
};
