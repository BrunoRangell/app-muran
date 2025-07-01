import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDaysInMonth } from "date-fns";

export interface GoogleAdsClientData {
  id: string; // Mapeado de clientId
  company_name: string; // Mapeado de clientName
  google_account_id?: string;
  google_account_name?: string;
  hasAccount: boolean;
  // Estrutura de revisão padronizada
  review?: {
    total_spent: number;
    daily_budget_current: number;
  };
  // Campos de orçamento padronizados
  budget_amount: number;
  original_budget_amount: number;
  // Campos de cálculo padronizados
  needsAdjustment: boolean;
  budgetCalculation?: {
    budgetDifference: number;
    remainingDays: number;
    idealDailyBudget: number;
    needsBudgetAdjustment: boolean;
    needsAdjustmentBasedOnAverage: boolean;
    warningIgnoredToday: boolean;
  };
  // Campos específicos do Google Ads
  weightedAverage?: number;
  isUsingCustomBudget?: boolean;
  customBudget?: any;
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
  console.log("🔍 Buscando dados do Google Ads com estrutura padronizada...");
  
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
        client_id,
        warning_ignored_today,
        warning_ignored_date
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
        
        // CÁLCULO DO DIÁRIO IDEAL
        const currentDate = new Date();
        const daysInMonth = getDaysInMonth(currentDate);
        const currentDay = currentDate.getDate();
        const remainingDays = daysInMonth - currentDay + 1;
        
        const totalSpent = latestReview?.total_spent || 0;
        const budgetAmount = latestReview?.custom_budget_amount || account.budget_amount || 0;
        const remainingBudget = budgetAmount - totalSpent;
        const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        
        // MÉDIA PONDERADA CORRETA - usar o valor calculado na edge function
        const weightedAverage = latestReview?.last_five_days_spent || 0;
        
        // CÁLCULO DO AJUSTE RECOMENDADO
        const budgetDifference = idealDailyBudget - weightedAverage;
        const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5; // R$ 5 de diferença
        
        console.log(`🧮 Cálculos para ${client.company_name}:`, {
          idealDailyBudget: idealDailyBudget.toFixed(2),
          weightedAverage: weightedAverage.toFixed(2),
          budgetDifference: budgetDifference.toFixed(2),
          needsBudgetAdjustment
        });
        
        // ESTRUTURA PADRONIZADA - igual ao Meta Ads
        const clientData: GoogleAdsClientData = {
          // IDs padronizados
          id: client.id,
          company_name: client.company_name,
          
          // Informações da conta Google
          google_account_id: account.account_id,
          google_account_name: account.account_name,
          hasAccount: true,
          
          // Estrutura de revisão padronizada
          review: {
            total_spent: totalSpent,
            daily_budget_current: latestReview?.daily_budget_current || account.budget_amount || 0
          },
          
          // Campos de orçamento padronizados
          budget_amount: budgetAmount,
          original_budget_amount: account.budget_amount || 0,
          
          // Cálculos básicos para determinar se precisa ajuste
          needsAdjustment: needsBudgetAdjustment,
          
          // Campos específicos do Google Ads
          weightedAverage: weightedAverage, // AGORA É A MÉDIA PONDERADA CORRETA
          isUsingCustomBudget: latestReview?.using_custom_budget || false,
          
          // Estrutura de cálculo padronizada COM DIÁRIO IDEAL CORRETO
          budgetCalculation: {
            budgetDifference: budgetDifference, // AGORA CALCULADO CORRETAMENTE
            remainingDays: remainingDays,
            idealDailyBudget: idealDailyBudget,
            needsBudgetAdjustment: needsBudgetAdjustment, // BASEADO NA MÉDIA PONDERADA
            needsAdjustmentBasedOnAverage: needsBudgetAdjustment,
            warningIgnoredToday: latestReview?.warning_ignored_today || false
          }
        };

        result.push(clientData);
        
        console.log(`✅ Cliente processado: ${client.company_name} (COM conta Google)`, {
          hasAccount: true,
          totalSpent: clientData.review?.total_spent,
          budgetAmount: clientData.budget_amount,
          idealDailyBudget: idealDailyBudget,
          weightedAverage: weightedAverage,
          budgetDifference: budgetDifference,
          remainingDays: remainingDays,
          needsAdjustment: clientData.needsAdjustment
        });
      }
    } else {
      // Cliente SEM conta Google Ads - estrutura padronizada
      const clientData: GoogleAdsClientData = {
        // IDs padronizados
        id: client.id,
        company_name: client.company_name,
        
        // Sem conta
        hasAccount: false,
        
        // Estrutura de revisão padronizada (zerada)
        review: {
          total_spent: 0,
          daily_budget_current: 0
        },
        
        // Campos de orçamento padronizados (zerados)
        budget_amount: 0,
        original_budget_amount: 0,
        
        // Sem necessidade de ajuste
        needsAdjustment: false,
        
        // Campos específicos do Google Ads (zerados)
        weightedAverage: 0,
        isUsingCustomBudget: false,
        
        // Estrutura de cálculo padronizada (zerada)
        budgetCalculation: {
          budgetDifference: 0,
          remainingDays: 0,
          idealDailyBudget: 0,
          needsBudgetAdjustment: false,
          needsAdjustmentBasedOnAverage: false,
          warningIgnoredToday: false
        }
      };

      result.push(clientData);
      
      console.log(`✅ Cliente processado: ${client.company_name} (SEM conta Google)`, {
        hasAccount: false,
        allFieldsZeroed: true
      });
    }
  }

  console.log(`✅ Estrutura de dados padronizada - Total: ${result.length} clientes`, {
    comConta: result.filter(c => c.hasAccount).length,
    semConta: result.filter(c => !c.hasAccount).length,
    precisamAjuste: result.filter(c => c.needsAdjustment).length
  });
  
  return result;
};

export const useGoogleAdsData = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['improved-google-reviews'], // CORREÇÃO: Padronizando query key
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

    const totalSpent = data.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
    const totalBudget = data.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
    const clientsWithAdjustments = data.filter(client => client.needsAdjustment).length;
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
