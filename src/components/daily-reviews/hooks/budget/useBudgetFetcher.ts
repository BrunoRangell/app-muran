
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClientWithReview } from "../types/reviewTypes";

/**
 * Hook para buscar e gerenciar orçamentos personalizados - VERSÃO UNIFICADA
 */
export const useBudgetFetcher = (client: ClientWithReview, accountId?: string) => {
  const [customBudget, setCustomBudget] = useState<any | null>(null);
  const [isLoadingCustomBudget, setIsLoadingCustomBudget] = useState(false);
  
  // Verificar se o cliente tem uma revisão recente
  const hasReview = !!client.lastReview;
  
  // Verificar se já está usando orçamento personalizado na revisão
  const isUsingCustomBudgetInReview = hasReview && client.lastReview?.using_custom_budget === true;
  
  useEffect(() => {
    const fetchCustomBudget = async () => {
      try {
        setIsLoadingCustomBudget(true);
        
        // Se já temos a informação do orçamento personalizado na revisão, usamos ela
        if (isUsingCustomBudgetInReview && client.lastReview?.custom_budget_id) {
          const { data, error } = await supabase
            .from("custom_budgets")
            .select("*")
            .eq("id", client.lastReview.custom_budget_id)
            .eq("platform", "meta")
            .maybeSingle();
            
          if (error) {
            console.error("Erro ao buscar orçamento personalizado da revisão:", error);
            return;
          }
          
          console.log(`[useBudgetFetcher] Orçamento personalizado encontrado para o cliente ${client.company_name}:`, data);
          setCustomBudget(data);
          return;
        }
        
        // Buscar orçamento personalizado ativo para a data atual
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("client_id", client.id)
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today)
          .order("created_at", { ascending: false })
          .maybeSingle();
          
        if (error) {
          console.error("Erro ao buscar orçamento personalizado:", error);
          return;
        }
        
        console.log(`[useBudgetFetcher] Verificando orçamentos personalizados para ${client.company_name}:`, {
          orçamentoEncontrado: data,
          isUsingCustomBudgetInReview,
          custom_budget_id: client.lastReview?.custom_budget_id
        });
        
        setCustomBudget(data);
      } catch (error) {
        console.error("Erro ao buscar orçamento personalizado:", error);
      } finally {
        setIsLoadingCustomBudget(false);
      }
    };
    
    if (client?.id) {
      fetchCustomBudget();
    }
  }, [client.id, isUsingCustomBudgetInReview, client.lastReview]);
  
  return {
    customBudget,
    isLoadingCustomBudget,
    hasReview,
    isUsingCustomBudgetInReview
  };
};
