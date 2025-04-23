
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { calculateIdealDailyBudget } from "../summary/utils";
import { ClientWithReview } from "./types/reviewTypes";
import { useCustomBudget } from "./useCustomBudget";

export const useClientBudgetCalculation = (client: ClientWithReview, accountId?: string) => {
  const [hasReview, setHasReview] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [currentDailyBudget, setCurrentDailyBudget] = useState(0);
  const [idealDailyBudget, setIdealDailyBudget] = useState(0);
  const [budgetDifference, setBudgetDifference] = useState(0);
  const [actualBudgetAmount, setActualBudgetAmount] = useState(0);
  const [accountName, setAccountName] = useState<string | undefined>(undefined);
  const [remainingDaysValue, setRemainingDaysValue] = useState(0);
  const { toast } = useToast();
  
  const { 
    customBudget, 
    isUsingCustomBudgetInReview, 
    isLoadingCustomBudget 
  } = useCustomBudget(client.id);

  useEffect(() => {
    setMonthlyBudget(client.meta_ads_budget || 0);
  }, [client.meta_ads_budget]);

  useEffect(() => {
    const calculateBudget = async () => {
      setIsCalculating(true);
      setCalculationError(null);
      
      try {
        // 1. Obter o orçamento atual (padrão ou personalizado)
        let currentBudget = client.meta_ads_budget || 0;
        
        // Se estamos usando uma conta específica, buscar seu orçamento
        if (accountId) {
          const { data: metaAccount } = await supabase
            .from('client_meta_accounts')
            .select('budget_amount, account_name')
            .eq('client_id', client.id)
            .eq('account_id', accountId)
            .maybeSingle();
            
          if (metaAccount) {
            currentBudget = metaAccount.budget_amount;
            setAccountName(metaAccount.account_name);
          }
        } else if (customBudget && isUsingCustomBudgetInReview) {
          currentBudget = customBudget.budget_amount;
          setAccountName(customBudget.account_name);
        }
        
        setActualBudgetAmount(currentBudget);
        
        // 2. Calcular o total gasto
        const totalSpentValue = await calculateTotalSpent();
        setTotalSpent(totalSpentValue || 0);
        
        // 3. Buscar a revisão mais recente
        const latestReview = client.lastReview;
        
        if (latestReview) {
          setHasReview(true);
          setCurrentDailyBudget(latestReview.meta_daily_budget_current || 0);
          
          // 4. Calcular o orçamento diário ideal e dias restantes
          const currentDate = new Date();
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
          setRemainingDaysValue(remainingDays);
          
          const idealBudget = calculateIdealDailyBudget(
            currentBudget,
            new Date(latestReview.review_date)
          );
          setIdealDailyBudget(idealBudget);
          
          // 5. Calcular a diferença de orçamento
          setBudgetDifference(idealBudget - (latestReview.meta_daily_budget_current || 0));
        } else {
          setHasReview(false);
          setCurrentDailyBudget(0);
          setIdealDailyBudget(0);
          setBudgetDifference(0);
        }
      } catch (error: any) {
        console.error("Erro ao calcular orçamento:", error);
        setCalculationError(error.message || "Erro ao calcular orçamento");
        toast({
          title: "Erro ao calcular orçamento",
          description: error.message || "Ocorreu um erro ao calcular o orçamento",
          variant: "destructive",
        });
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateBudget();
  }, [client, customBudget, isUsingCustomBudgetInReview, toast, accountId]);

  const calculateTotalSpent = async () => {
    if (!client?.id) return 0;
    
    try {
      // Primeiro verificar se já existe uma revisão para hoje com o valor gasto
      const { data: reviewData } = await supabase
        .from('daily_budget_reviews')
        .select('meta_total_spent, meta_daily_budget_current')
        .eq('client_id', client.id)
        .eq('review_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (reviewData?.meta_total_spent !== null && reviewData?.meta_total_spent !== undefined) {
        return reviewData.meta_total_spent;
      }
      
      // Se houver um accountId específico, buscar apenas para essa conta
      if (accountId) {
        const { data: metaAccount } = await supabase
          .from('client_meta_accounts')
          .select('*')
          .eq('client_id', client.id)
          .eq('account_id', accountId)
          .maybeSingle();
          
        if (metaAccount) {
          return metaAccount.budget_amount * 0.7; // Simular um valor gasto (70% do orçamento)
        }
      }
      
      return client.meta_ads_budget ? client.meta_ads_budget * 0.65 : 0; // Valor padrão simulado
    } catch (error) {
      console.error('Erro ao calcular total gasto:', error);
      return 0;
    }
  };

  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    customBudget,
    isUsingCustomBudgetInReview,
    isLoadingCustomBudget,
    actualBudgetAmount,
    accountName,
    remainingDaysValue,
    calculateTotalSpent
  };
};
