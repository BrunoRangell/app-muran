
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientWithReview } from "../types/clientTypes";
import { getActiveCustomBudget } from "../services/budgetService";
import { useBudgetCalculator } from "./useBudgetCalculator";

export function useClientReviews(platform: 'meta' | 'google' = 'meta') {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [showOnlyWithAccounts, setShowOnlyWithAccounts] = useState(true);
  const { calculate } = useBudgetCalculator();

  // Função para buscar os clientes com suas revisões mais recentes
  const {
    data: clients,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["clients-with-reviews", platform],
    queryFn: async () => {
      let accountIdField = platform === 'meta' ? 'meta_account_id' : 'google_account_id';
      
      // Buscar todos os clientes ativos
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*, meta_accounts(*)")
        .eq("status", "active")
        .order("company_name");
        
      if (clientsError) {
        throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
      }
      
      // Para cada cliente, buscar a revisão mais recente
      const clientsWithReviews: ClientWithReview[] = await Promise.all(
        clientsData.map(async (client) => {
          // Buscar a última revisão do cliente
          let reviewQuery = supabase
            .from(platform === 'meta' ? "daily_budget_reviews" : "google_ads_reviews")
            .select("*")
            .eq("client_id", client.id)
            .order("review_date", { ascending: false })
            .limit(1);
            
          const { data: reviewData, error: reviewError } = await reviewQuery;
          
          if (reviewError) {
            console.error(`Erro ao buscar revisão para cliente ${client.id}:`, reviewError);
          }
          
          // Verificar se há orçamento personalizado ativo
          const customBudget = await getActiveCustomBudget(
            client.id, 
            platform, 
            client[accountIdField]
          );
          
          const lastReview = reviewData && reviewData.length > 0 ? reviewData[0] : null;
          
          // Se existe um orçamento personalizado mas não está sendo usado na revisão,
          // calcular os valores com base nele
          let enhancedReview = lastReview;
          
          if (lastReview && customBudget && !lastReview.using_custom_budget) {
            // Calcular os valores com o orçamento personalizado
            const budgetInfo = calculate({
              monthlyBudget: client[`${platform}_ads_budget`],
              totalSpent: platform === 'meta' ? lastReview.meta_total_spent : lastReview.google_total_spent,
              currentDailyBudget: platform === 'meta' ? lastReview.meta_daily_budget_current : lastReview.google_daily_budget_current,
              lastFiveDaysAverage: platform === 'meta' ? lastReview.meta_last_five_days_spent : lastReview.google_last_five_days_spent,
              customBudgetAmount: customBudget.budget_amount,
              customBudgetEndDate: customBudget.end_date,
              usingCustomBudget: true
            });
            
            // Adicionar as informações do orçamento personalizado à revisão
            enhancedReview = {
              ...lastReview,
              using_custom_budget: true,
              custom_budget_id: customBudget.id,
              custom_budget_amount: customBudget.budget_amount,
              custom_budget_start_date: customBudget.start_date,
              custom_budget_end_date: customBudget.end_date,
              // Campos computados
              computed_ideal_daily_budget: budgetInfo.idealDailyBudget,
              computed_budget_difference: budgetInfo.budgetDifference,
              computed_needs_adjustment: budgetInfo.needsBudgetAdjustment
            };
          }

          return {
            ...client,
            lastReview: enhancedReview
          };
        })
      );

      return clientsWithReviews;
    },
  });

  // Filtrar clientes com base nas opções selecionadas
  const filteredClients = clients
    ?.filter(client => {
      // Filtrar por termo de busca
      const matchesSearch = client.company_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Filtrar por conta configurada
      const hasAccount = platform === 'meta' 
        ? !!client.meta_account_id
        : !!client.google_account_id;
        
      const showBasedOnAccount = showOnlyWithAccounts ? hasAccount : true;
      
      // Filtrar por necessidade de ajuste
      let needsAdjustment = false;
      if (client.lastReview) {
        const reviewField = platform === 'meta' ? 'meta_daily_budget_current' : 'google_daily_budget_current';
        needsAdjustment = client.lastReview.computed_needs_adjustment || false;
      }
      
      const showBasedOnAdjustment = showOnlyAdjustments ? needsAdjustment : true;
      
      return matchesSearch && showBasedOnAccount && showBasedOnAdjustment;
    })
    .sort((a, b) => a.company_name.localeCompare(b.company_name));

  return {
    clients: filteredClients,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    showOnlyAdjustments,
    setShowOnlyAdjustments,
    showOnlyWithAccounts,
    setShowOnlyWithAccounts
  };
}
