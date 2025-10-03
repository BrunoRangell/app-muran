import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMetaReviewsWorker } from "@/hooks/useMetaReviewsWorker";
import { logger } from "@/lib/logger";

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

  const { isWorkerReady, processMetaData } = useMetaReviewsWorker();

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["improved-meta-reviews"],
    queryFn: async () => {
      logger.debug("🔄 FASE 5A: Iniciando busca unificada de dados...");
      
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      
      // FASE 4A: Consolidar queries em batch com Promise.all
      const [
        clientsResult,
        metaAccountsResult,
        reviewsResult,
        budgetsResult,
        campaignHealthResult
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, status")
          .eq("status", "active"),
        
        supabase
          .from("client_accounts")
          .select("id, client_id, account_id, account_name, platform, status, budget_amount, is_primary, saldo_restante, is_prepay_account, last_funding_detected_at, last_funding_amount")
          .eq("status", "active")
          .eq("platform", "meta")
          .order("client_id")
          .order("is_primary", { ascending: false }),
        
        supabase
          .from("budget_reviews")
          .select("id, client_id, account_id, platform, review_date, daily_budget_current, total_spent, using_custom_budget, custom_budget_id, custom_budget_amount, custom_budget_start_date, custom_budget_end_date, warning_ignored_today, warning_ignored_date, day_1_spent, day_2_spent, day_3_spent, day_4_spent, day_5_spent, last_five_days_spent")
          .eq("platform", "meta")
          .gte("review_date", firstDayStr)
          .order("review_date", { ascending: false }),
        
        supabase
          .from("custom_budgets")
          .select("id, client_id, budget_amount, start_date, end_date, platform, is_active")
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", todayStr)
          .gte("end_date", todayStr),
        
        supabase
          .from("campaign_health")
          .select("id, client_id, account_id, platform, snapshot_date, active_campaigns_count, unserved_campaigns_count, has_account")
          .eq("snapshot_date", todayStr)
          .eq("platform", "meta")
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (metaAccountsResult.error) throw metaAccountsResult.error;
      if (reviewsResult.error) throw reviewsResult.error;
      if (budgetsResult.error) throw budgetsResult.error;
      if (campaignHealthResult.error) throw campaignHealthResult.error;

      const clients = clientsResult.data || [];
      const metaAccounts = metaAccountsResult.data || [];
      const reviews = reviewsResult.data || [];
      const activeCustomBudgets = budgetsResult.data || [];
      const campaignHealthData = campaignHealthResult.data || [];

      logger.debug("✅ FASE 4A: Batch query concluído:", {
        clients: clients.length,
        metaAccounts: metaAccounts.length,
        reviews: reviews.length,
        activeCustomBudgets: activeCustomBudgets.length,
        campaignHealth: campaignHealthData.length
      });

      // FASE 5A & 5B: Processar dados no Web Worker (código duplicado removido)
      if (!isWorkerReady) {
        logger.warn('⚠️ Worker não está pronto, retornando dados básicos');
        return clients?.map(client => ({
          ...client,
          hasMetaAccount: false,
          metaAccounts: [],
        })) || [];
      }

      logger.debug('⚙️ FASE 5A: Enviando dados para Web Worker...');
      const result = await processMetaData(
        clients,
        metaAccounts,
        reviews,
        activeCustomBudgets,
        campaignHealthData
      );

      logger.debug('✅ FASE 5A: Dados processados pelo Worker:', {
        totalClients: result.clients.length,
        withMetaAccounts: result.clients.filter((c: any) => c.hasAccount).length,
      });

      setMetrics(result.metrics);
      return result.clients;
    },
    staleTime: 30 * 60 * 1000, // FASE 4A: 30 minutos
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refreshData: refetch
  };
}
