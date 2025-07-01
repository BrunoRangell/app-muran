
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Função para calcular média ponderada dos últimos 5 dias
const calculateWeightedAverage = (day1: number, day2: number, day3: number, day4: number, day5: number): number => {
  // Pesos: dia mais recente tem maior peso
  // day5 = ontem (30%), day4 = anteontem (25%), etc.
  const weightedSum = (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
  
  console.log(`🔍 Calculando média ponderada:`, {
    day1, day2, day3, day4, day5,
    weightedSum,
    formula: 'day1*0.1 + day2*0.15 + day3*0.2 + day4*0.25 + day5*0.3'
  });
  
  return weightedSum;
};

// Função para calcular orçamento diário ideal
const calculateIdealDailyBudget = (budgetAmount: number, totalSpent: number, customBudgetEndDate?: string): number => {
  const today = new Date();
  let remainingDays: number;
  
  if (customBudgetEndDate) {
    const endDate = new Date(customBudgetEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    remainingDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
  } else {
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
  }
  
  const remainingBudget = Math.max(0, budgetAmount - totalSpent);
  const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  
  console.log(`📊 Calculando orçamento diário ideal:`, {
    budgetAmount,
    totalSpent,
    remainingBudget,
    remainingDays,
    idealDailyBudget,
    customBudgetEndDate
  });
  
  return Math.round(idealDailyBudget * 100) / 100;
};

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
        warning_ignored_date,
        day_1_spent,
        day_2_spent,
        day_3_spent,
        day_4_spent,
        day_5_spent,
        custom_budget_end_date
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
        
        // Calcular média ponderada dos últimos 5 dias
        const day1Spent = latestReview?.day_1_spent || 0;
        const day2Spent = latestReview?.day_2_spent || 0;
        const day3Spent = latestReview?.day_3_spent || 0;
        const day4Spent = latestReview?.day_4_spent || 0;
        const day5Spent = latestReview?.day_5_spent || 0;
        
        const weightedAverage = calculateWeightedAverage(day1Spent, day2Spent, day3Spent, day4Spent, day5Spent);
        
        // Determinar orçamento atual (personalizado ou padrão)
        const budgetAmount = latestReview?.custom_budget_amount || account.budget_amount || 0;
        const totalSpent = latestReview?.total_spent || 0;
        
        // Calcular orçamento diário ideal
        const idealDailyBudget = calculateIdealDailyBudget(
          budgetAmount, 
          totalSpent, 
          latestReview?.custom_budget_end_date
        );
        
        // Calcular diferença para determinar necessidade de ajuste
        const budgetDifference = idealDailyBudget - weightedAverage;
        const needsAdjustment = !latestReview?.warning_ignored_today && Math.abs(budgetDifference) >= 5;
        
        // Calcular dias restantes
        const today = new Date();
        let remainingDays: number;
        
        if (latestReview?.custom_budget_end_date) {
          const endDate = new Date(latestReview.custom_budget_end_date);
          const timeDiff = endDate.getTime() - today.getTime();
          remainingDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
        } else {
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
        }
        
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
          needsAdjustment,
          
          // Campos específicos do Google Ads
          weightedAverage,
          isUsingCustomBudget: latestReview?.using_custom_budget || false,
          
          // Estrutura de cálculo padronizada - CORRIGIDA
          budgetCalculation: {
            budgetDifference,
            remainingDays,
            idealDailyBudget,
            needsBudgetAdjustment: needsAdjustment,
            needsAdjustmentBasedOnAverage: needsAdjustment,
            warningIgnoredToday: latestReview?.warning_ignored_today || false
          }
        };

        result.push(clientData);
        
        console.log(`✅ Cliente processado: ${client.company_name} (COM conta Google)`, {
          hasAccount: true,
          totalSpent: clientData.review?.total_spent,
          budgetAmount: clientData.budget_amount,
          weightedAverage,
          idealDailyBudget,
          budgetDifference,
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
