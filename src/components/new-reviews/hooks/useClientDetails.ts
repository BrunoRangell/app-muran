
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "@/lib/metaAuth";
import { useToast } from "@/hooks/use-toast";

export function useClientDetails(clientId: string) {
  const [isReviewing, setIsReviewing] = useState(false);
  const { toast } = useToast();
  
  // Buscar dados do cliente
  const { 
    data: client,
    isLoading: isLoadingClient,
    error: clientError,
    refetch: refetchClient
  } = useQuery({
    queryKey: ["client-details", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });
  
  // Buscar a revisão mais recente
  const {
    data: latestReview,
    isLoading: isLoadingReview,
    error: reviewError,
    refetch: refetchReview
  } = useQuery({
    queryKey: ["latest-review", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });
  
  // Buscar histórico de revisões
  const {
    data: reviewHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ["review-history", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });
  
  // Função para realizar a revisão do cliente
  const reviewClient = async () => {
    try {
      if (!clientId || !client?.meta_account_id) {
        toast({
          title: "Erro",
          description: "Cliente sem conta Meta configurada",
          variant: "destructive"
        });
        return;
      }
      
      setIsReviewing(true);
      
      // Obter token de acesso
      const accessToken = await getMetaAccessToken();
      
      if (!accessToken) {
        throw new Error("Token de acesso Meta não disponível");
      }
      
      // Chamar função edge para realizar a revisão
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: {
          clientId: clientId,
          accessToken: accessToken,
          accountId: client.meta_account_id
        }
      });
      
      if (error) {
        throw new Error(`Erro ao analisar cliente: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido na análise");
      }
      
      // Atualizar dados
      refetchReview();
      refetchHistory();
      
      toast({
        title: "Cliente analisado",
        description: "A análise foi concluída com sucesso"
      });
      
    } catch (error) {
      console.error("Erro ao analisar cliente:", error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsReviewing(false);
    }
  };
  
  const isLoading = isLoadingClient || isLoadingReview;
  const error = clientError || reviewError || historyError;
  
  const refetchAll = () => {
    refetchClient();
    refetchReview();
    refetchHistory();
  };
  
  return {
    client,
    latestReview,
    reviewHistory,
    isLoading,
    isLoadingHistory,
    error,
    refetchClient: refetchAll,
    reviewClient,
    isReviewing
  };
}
