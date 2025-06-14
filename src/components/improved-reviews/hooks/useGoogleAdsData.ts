import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { ClientMetrics } from "./useUnifiedReviewsData";
import { logger } from "@/utils/logger";
import { 
  fetchGoogleReviews, 
  processGoogleClientAccount, 
  createGoogleClientWithoutAccount,
  ProcessedClientData
} from "./services/googleAdsDataProcessor";
import { calculateGoogleMetrics } from "./services/googleMetricsCalculator";

export function useGoogleAdsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsWithoutAccount: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-google-reviews"],
    queryFn: async () => {
      try {
        logger.info('GOOGLE_ADS', 'Fetching Google Ads data');
        
        // Buscar clientes ativos
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select(`id, company_name, status, google_ads_budget, google_account_id`)
          .eq("status", "active");

        if (clientsError) throw clientsError;

        // Buscar contas Google adicionais
        const { data: additionalGoogleAccounts, error: accountsError } = await supabase
          .from("client_google_accounts")
          .select("*")
          .eq("status", "active")
          .eq("is_primary", false);

        if (accountsError) throw accountsError;

        // Buscar orçamentos personalizados ativos
        const today = new Date().toISOString().split('T')[0];
        const { data: customBudgets, error: customBudgetsError } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("platform", "google")
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today);

        if (customBudgetsError) throw customBudgetsError;

        // Buscar revisões
        const reviews = await fetchGoogleReviews();

        // Processar dados dos clientes
        const processedData = await processClientsData(
          clients || [], 
          additionalGoogleAccounts || [], 
          customBudgets || [],
          reviews,
          calculateBudget
        );

        // Calcular métricas
        const metricsData = calculateGoogleMetrics(processedData);
        setMetrics(metricsData);

        return processedData;
      } catch (error) {
        logger.error('GOOGLE_ADS', 'Failed to fetch Google Ads data', error);
        throw error;
      }
    }
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refreshData: refetch
  };
}

async function processClientsData(
  clients: any[], 
  additionalAccounts: any[], 
  customBudgets: any[],
  reviews: any[],
  calculateBudget: any
) {
  // Criar mapa de orçamentos personalizados
  const customBudgetMap = new Map();
  customBudgets.forEach(budget => {
    customBudgetMap.set(budget.client_id, budget);
  });

  // Processar cada cliente
  const clientsWithData = clients.map(client => {
    const customBudget = customBudgetMap.get(client.id);
    const isUsingCustomBudget = !!customBudget;
    
    const hasMainAccount = client.google_account_id && client.google_account_id !== '';
    const additionalClientAccounts = additionalAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    const allAccounts = [];
    
    if (hasMainAccount) {
      allAccounts.push({
        account_id: client.google_account_id,
        account_name: "Conta Principal",
        budget_amount: client.google_ads_budget || 0,
        is_primary: true
      });
    }
    
    additionalClientAccounts.forEach(account => {
      allAccounts.push({
        account_id: account.account_id,
        account_name: account.account_name,
        budget_amount: account.budget_amount,
        is_primary: false
      });
    });
    
    if (allAccounts.length > 0) {
      return allAccounts.map(account => 
        processGoogleClientAccount(client, account, reviews, customBudget, isUsingCustomBudget, calculateBudget)
      );
    } else {
      return createGoogleClientWithoutAccount(client);
    }
  }) || [];

  return clientsWithData.flat().filter(Boolean);
}
