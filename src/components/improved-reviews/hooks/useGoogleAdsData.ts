
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
  totalSpent: number;
  totalBudget: number;
  spentPercentage: number;
}

const fetchGoogleAdsData = async (): Promise<GoogleAdsClientData[]> => {
  console.log("🔍 Buscando dados do Google Ads com estrutura inclusiva...");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar TODOS os clientes ativos (igual ao Meta Ads)
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      client_accounts!left(
        id,
        account_id,
        account_name,
        budget_amount,
        platform,
        status
      ),
      budget_reviews!left(
        total_spent,
        daily_budget_current,
        review_date,
        using_custom_budget,
        custom_budget_amount,
        last_five_days_spent,
        platform,
        account_id,
        client_id
      )
    `)
    .eq('status', 'active');

  if (error) {
    console.error("❌ Erro ao buscar dados do Google Ads:", error);
    throw error;
  }

  console.log(`✅ Encontrados ${clientsData?.length || 0} clientes ativos`);

  const result: GoogleAdsClientData[] = [];

  for (const client of clientsData || []) {
    // Filtrar apenas contas Google Ads ativas
    const googleAccounts = (client as any).client_accounts?.filter(
      (acc: any) => acc.platform === 'google' && acc.status === 'active'
    ) || [];
    
    // Filtrar apenas revisões Google Ads
    const googleReviews = (client as any).budget_reviews?.filter(
      (rev: any) => rev.platform === 'google' && rev.client_id === client.id
    ) || [];

    if (googleAccounts.length > 0) {
      // Cliente COM conta Google Ads
      for (const account of googleAccounts) {
        // Buscar revisões para esta conta específica
        const accountReviews = googleReviews.filter(
          (rev: any) => rev.account_id === account.id
        );
        
        const latestReview = accountReviews.find((r: any) => r.review_date === today) || accountReviews[0];
        
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

        // Manter cálculo específico do Google Ads
        if (clientData.totalSpent && clientData.dailyBudget) {
          const spentPercentage = (clientData.totalSpent / clientData.dailyBudget) * 100;
          clientData.needsBudgetAdjustment = spentPercentage > 80 || spentPercentage < 20;
        }

        result.push(clientData);
      }
    } else {
      // Cliente SEM conta Google Ads (igual ao Meta Ads)
      const clientData: GoogleAdsClientData = {
        clientId: client.id,
        clientName: client.company_name,
        hasAccount: false,
        totalSpent: 0,
        dailyBudget: 0,
        budgetAmount: 0,
        lastFiveDaysSpent: 0,
        usingCustomBudget: false,
        needsBudgetAdjustment: false
      };

      result.push(clientData);
    }
  }

  console.log(`✅ Processados ${result.length} dados do Google Ads (incluindo clientes sem conta)`);
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
      totalSpent: 0,
      totalBudget: 0,
      spentPercentage: 0
    };

    const totalSpent = data.reduce((sum, client) => sum + (client.totalSpent || 0), 0);
    const totalBudget = data.reduce((sum, client) => sum + (client.budgetAmount || 0), 0);
    const clientsWithAdjustments = data.filter(client => client.needsBudgetAdjustment).length;
    const clientsWithoutAccount = data.filter(client => !client.hasAccount).length;

    return {
      totalClients: data.length,
      clientsWithAdjustments,
      clientsWithoutAccount,
      averageSpend: data.length > 0 ? totalSpent / data.length : 0,
      totalSpent,
      totalBudget,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
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
