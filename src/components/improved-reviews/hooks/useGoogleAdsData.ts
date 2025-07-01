
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoogleAdsClientData {
  clientId: string;
  clientName: string;
  googleAccountId?: string;
  googleAccountName?: string;
  totalSpent?: number;
  dailyBudget?: number;
  lastReviewDate?: string;
  needsBudgetAdjustment?: boolean;
  hasAccount: boolean;
  lastFiveDaysSpent?: number;
  customBudgetActive?: boolean;
  customBudgetAmount?: number;
  usingCustomBudget?: boolean;
  budgetAmount?: number;
}

export interface GoogleAdsMetrics {
  totalClients: number;
  clientsWithAdjustments: number;
  clientsWithoutAccount: number;
  averageSpend: number;
  totalSpend: number;
  totalBudget: number;
  spentPercentage: number;
}

const fetchGoogleAdsData = async (): Promise<GoogleAdsClientData[]> => {
  console.log("🔍 Buscando dados do Google Ads da estrutura unificada...");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar clientes com contas Google Ads ativas
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      client_accounts!inner(
        id,
        account_id,
        account_name,
        budget_amount,
        budget_reviews(
          total_spent,
          daily_budget_current,
          review_date,
          using_custom_budget,
          custom_budget_amount,
          last_five_days_spent
        )
      )
    `)
    .eq('status', 'active')
    .eq('client_accounts.platform', 'google')
    .eq('client_accounts.status', 'active');

  if (error) {
    console.error("❌ Erro ao buscar dados do Google Ads:", error);
    throw error;
  }

  console.log(`✅ Encontrados ${clientsData?.length || 0} clientes com Google Ads`);

  const result: GoogleAdsClientData[] = [];

  for (const client of clientsData || []) {
    const accounts = (client as any).client_accounts || [];
    
    for (const account of accounts) {
      const reviews = account.budget_reviews || [];
      const latestReview = reviews.find((r: any) => r.review_date === today) || reviews[0];
      
      const clientData: GoogleAdsClientData = {
        clientId: client.id,
        clientName: client.company_name,
        googleAccountId: account.account_id,
        googleAccountName: account.account_name,
        hasAccount: true,
        totalSpent: latestReview?.total_spent || 0,
        dailyBudget: latestReview?.daily_budget_current || account.budget_amount || 0,
        budgetAmount: latestReview?.custom_budget_amount || account.budget_amount || 0,
        lastReviewDate: latestReview?.review_date,
        lastFiveDaysSpent: latestReview?.last_five_days_spent || 0,
        usingCustomBudget: latestReview?.using_custom_budget || false,
        customBudgetAmount: latestReview?.custom_budget_amount,
        needsBudgetAdjustment: false // Será calculado baseado na lógica de negócio
      };

      // Calcular se precisa de ajuste de orçamento
      if (clientData.totalSpent && clientData.dailyBudget) {
        const spentPercentage = (clientData.totalSpent / clientData.dailyBudget) * 100;
        clientData.needsBudgetAdjustment = spentPercentage > 80 || spentPercentage < 20;
      }

      result.push(clientData);
    }
  }

  console.log(`✅ Processados ${result.length} dados do Google Ads`);
  return result;
};

export const useGoogleAdsData = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['google-ads-unified-data'],
    queryFn: fetchGoogleAdsData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const metrics = useMemo<GoogleAdsMetrics>(() => {
    if (!data) return {
      totalClients: 0,
      clientsWithAdjustments: 0,
      clientsWithoutAccount: 0,
      averageSpend: 0,
      totalSpend: 0,
      totalBudget: 0,
      spentPercentage: 0
    };

    const totalSpend = data.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    const totalBudget = data.reduce((sum, client) => sum + (client.budgetAmount || 0), 0);
    const clientsWithAdjustments = data.filter(client => client.needsBudgetAdjustment).length;

    return {
      totalClients: data.length,
      clientsWithAdjustments,
      clientsWithoutAccount: 0, // Todos têm conta pois filtramos na query
      averageSpend: data.length > 0 ? totalSpend / data.length : 0,
      totalSpend,
      totalBudget,
      spentPercentage: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0
    };
  }, [data]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    data: data || [],
    metrics,
    isLoading,
    error,
    refreshData,
    searchQuery,
    setSearchQuery,
    isRefreshing
  };
};
