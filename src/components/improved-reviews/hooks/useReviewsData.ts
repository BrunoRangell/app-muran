
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../../daily-reviews/hooks/types/reviewTypes";
import { useCallback, useMemo, useState } from "react";

interface UseReviewsDataProps {
  platformFilter?: "meta" | "google" | "all";
}

export const useReviewsData = ({ platformFilter = "all" }: UseReviewsDataProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table" | "list">("grid");

  // Fetch clients and their last reviews
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-clients-with-reviews", platformFilter],
    queryFn: async () => {
      // Buscar todos os clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          meta_account_id,
          meta_ads_budget,
          google_account_id,
          google_ads_budget,
          meta_accounts (
            id,
            account_id,
            account_name,
            is_primary,
            budget_amount
          ),
          google_accounts (
            id,
            account_id,
            account_name,
            is_primary,
            budget_amount
          )
        `)
        .eq("status", "active")
        .order("company_name");

      if (clientsError) {
        throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
      }

      // Filtrar clientes com base no platformFilter
      let filteredClients = clients;
      if (platformFilter === "meta") {
        filteredClients = clients.filter(client => client.meta_account_id);
      } else if (platformFilter === "google") {
        filteredClients = clients.filter(client => client.google_account_id);
      }

      // Buscar as revisões mais recentes para cada cliente
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .in("client_id", filteredClients.map(client => client.id))
        .order("review_date", { ascending: false });

      if (reviewsError) {
        throw new Error(`Erro ao buscar revisões: ${reviewsError.message}`);
      }

      // Associar cada cliente à sua revisão mais recente
      return filteredClients.map((client) => {
        // Encontrar a revisão mais recente para este cliente
        const clientReviews = reviews.filter(review => review.client_id === client.id);
        const lastReview = clientReviews.length > 0 ? clientReviews[0] : null;

        // Converter para o tipo ClientWithReview
        const clientWithReview = {
          ...client,
          lastReview,
          status: "active" as const,
          meta_accounts: client.meta_accounts || [],
          google_accounts: client.google_accounts || []
        } as unknown as ClientWithReview;

        return clientWithReview;
      });
    },
    refetchInterval: 300000, // 5 minutos
  });

  // Função para calcular se um cliente precisa de ajuste de orçamento
  const calculateNeedsAdjustment = useCallback((client: ClientWithReview): boolean => {
    if (!client.lastReview || !client.meta_account_id) return false;
    
    const currentBudget = client.lastReview.meta_daily_budget_current || 0;
    
    // Calcular o orçamento ideal
    let idealBudget = client.lastReview.idealDailyBudget;
    
    if (idealBudget === undefined) {
      // Calcular o orçamento ideal baseado no orçamento normal ou personalizado
      const totalSpent = client.lastReview.meta_total_spent || 0;
      const budgetAmount = client.lastReview.using_custom_budget 
        ? client.lastReview.custom_budget_amount || client.meta_ads_budget || 0
        : client.meta_ads_budget || 0;
      
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      idealBudget = remainingDays > 0 ? (budgetAmount - totalSpent) / remainingDays : 0;
    }
    
    const difference = Math.abs(idealBudget - currentBudget);
    return difference >= 5;
  }, []);

  // Filtragem e ordenação de dados
  const filteredClients = useMemo(() => {
    if (!data) return [];

    // Aplicar filtro de texto
    let filtered = data;
    if (searchQuery) {
      filtered = filtered.filter(client => 
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtro de ajustes
    if (showOnlyAdjustments) {
      filtered = filtered.filter(client => calculateNeedsAdjustment(client));
    }

    // Ordenar por nome da empresa
    return [...filtered].sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [data, searchQuery, showOnlyAdjustments, calculateNeedsAdjustment]);

  // Separar clientes com e sem IDs configurados
  const clientsWithMetaId = useMemo(() => 
    filteredClients.filter(client => client.meta_account_id),
    [filteredClients]
  );

  const clientsWithoutMetaId = useMemo(() => 
    filteredClients.filter(client => !client.meta_account_id),
    [filteredClients]
  );

  const clientsWithGoogleId = useMemo(() => 
    filteredClients.filter(client => client.google_account_id),
    [filteredClients]
  );

  const clientsWithoutGoogleId = useMemo(() => 
    filteredClients.filter(client => !client.google_account_id),
    [filteredClients]
  );

  // Métricas e estatísticas
  const metrics = useMemo(() => {
    if (!data) return { totalClients: 0, clientsWithAdjustments: 0, adjustmentPercentage: 0 };

    const clientsWithAdjustments = data.filter(client => calculateNeedsAdjustment(client)).length;
    
    return {
      totalClients: data.length,
      clientsWithAdjustments,
      adjustmentPercentage: data.length > 0 
        ? Math.round((clientsWithAdjustments / data.length) * 100) 
        : 0
    };
  }, [data, calculateNeedsAdjustment]);

  // Data da última revisão
  const lastReviewTime = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const allReviews = data
      .filter(client => client.lastReview)
      .map(client => client.lastReview);
    
    if (allReviews.length === 0) return null;
    
    // Encontrar a revisão mais recente
    const mostRecentReview = allReviews.reduce((latest, current) => {
      if (!latest) return current;
      
      const latestDate = new Date(latest.updated_at || latest.created_at);
      const currentDate = new Date(current.updated_at || current.created_at);
      
      return currentDate > latestDate ? current : latest;
    }, null);
    
    return mostRecentReview 
      ? new Date(mostRecentReview.updated_at || mostRecentReview.created_at) 
      : null;
  }, [data]);

  return {
    // Estados
    searchQuery,
    setSearchQuery,
    showOnlyAdjustments,
    setShowOnlyAdjustments,
    viewMode,
    setViewMode,
    
    // Dados
    clients: data || [],
    filteredClients,
    clientsWithMetaId,
    clientsWithoutMetaId,
    clientsWithGoogleId,
    clientsWithoutGoogleId,
    
    // Status da query
    isLoading,
    error,
    refetch,
    
    // Métricas e utilitários
    metrics,
    lastReviewTime,
    calculateNeedsAdjustment,
  };
};
