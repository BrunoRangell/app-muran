
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { logger } from "@/utils/logger";
import {
  fetchMetaReviews,
  processMetaClientAccount,
  createMetaClientWithoutAccount,
  ProcessedMetaClientData
} from "./services/metaDataProcessor";
import { calculateMetaMetrics } from "./services/metaMetricsCalculator";

export type ClientMetrics = {
  totalClients: number;
  clientsWithoutAccount: number;
  totalBudget: number;
  totalSpent: number;
  spentPercentage: number;
};

export function useUnifiedReviewsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsWithoutAccount: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-meta-reviews"],
    queryFn: async () => {
      try {
        logger.info('META_ADS', 'Fetching Meta Ads data');
        
        // Buscar clientes ativos
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select(`id, company_name, status, meta_ads_budget, meta_account_id`)
          .eq("status", "active");

        if (clientsError) throw clientsError;

        // Buscar contas Meta adicionais
        const { data: additionalMetaAccounts, error: accountsError } = await supabase
          .from("client_meta_accounts")
          .select("*")
          .eq("status", "active")
          .eq("is_primary", false);

        if (accountsError) throw accountsError;

        // Buscar revisões desde o início do mês
        const reviews = await fetchMetaReviews();
        
        // Buscar orçamentos personalizados ativos
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const { data: activeCustomBudgets, error: budgetsError } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", todayStr)
          .gte("end_date", todayStr);
        
        if (budgetsError) throw budgetsError;

        // Processar dados
        const processedData = await processMetaClientsData(
          clients || [],
          additionalMetaAccounts || [],
          reviews,
          activeCustomBudgets || [],
          calculateBudget
        );

        // Calcular métricas
        const metricsData = calculateMetaMetrics(processedData);
        setMetrics(metricsData);

        return processedData;
      } catch (error) {
        logger.error('META_ADS', 'Failed to fetch Meta Ads data', error);
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

async function processMetaClientsData(
  clients: any[], 
  additionalMetaAccounts: any[], 
  reviews: any[], 
  activeCustomBudgets: any[], 
  calculateBudget: any
) {
  // Mapear orçamentos personalizados por client_id
  const customBudgetsByClientId = new Map();
  activeCustomBudgets.forEach(budget => {
    customBudgetsByClientId.set(budget.client_id, budget);
  });

  // Criar Set de clientes com contas Meta
  const clientsWithAccounts = new Set();
  
  clients.forEach(client => {
    if (client.meta_account_id) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  additionalMetaAccounts.forEach(account => {
    clientsWithAccounts.add(account.client_id);
  });

  // Processar cada cliente
  const clientsWithData = clients.map(client => {
    const hasMainAccount = client.meta_account_id && client.meta_account_id !== '';
    
    const additionalAccounts = additionalMetaAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    const allAccounts = [];
    
    if (hasMainAccount) {
      allAccounts.push({
        account_id: client.meta_account_id,
        account_name: "Conta Principal",
        budget_amount: client.meta_ads_budget || 0,
        is_primary: true
      });
    }
    
    additionalAccounts.forEach(account => {
      allAccounts.push({
        account_id: account.account_id,
        account_name: account.account_name,
        budget_amount: account.budget_amount,
        is_primary: false
      });
    });
    
    if (allAccounts.length > 0) {
      return allAccounts.map(account => 
        processMetaClientAccount(client, account, reviews, customBudgetsByClientId, calculateBudget)
      );
    } else {
      return createMetaClientWithoutAccount(client);
    }
  }) || [];

  return clientsWithData.flat();
}
