
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const useCustomBudget = (clientId: string) => {
  const [customBudget, setCustomBudget] = useState<any | null>(null);
  const [isUsingCustomBudgetInReview, setIsUsingCustomBudgetInReview] = useState(false);
  const [isLoadingCustomBudget, setIsLoadingCustomBudget] = useState(true);

  useEffect(() => {
    const fetchCustomBudget = async () => {
      setIsLoadingCustomBudget(true);
      try {
        // Buscar orçamentos personalizados ativos para este cliente
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from("meta_custom_budgets")
          .select("*")
          .eq("client_id", clientId)
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today)
          .order("created_at", { ascending: false })
          .maybeSingle();
          
        if (error) {
          console.error("Erro ao buscar orçamento personalizado:", error);
          setCustomBudget(null);
          setIsUsingCustomBudgetInReview(false);
        } else if (data) {
          setCustomBudget(data);
          setIsUsingCustomBudgetInReview(true);
        } else {
          setCustomBudget(null);
          setIsUsingCustomBudgetInReview(false);
        }
      } catch (error) {
        console.error("Erro ao verificar orçamento personalizado:", error);
      } finally {
        setIsLoadingCustomBudget(false);
      }
    };

    if (clientId) {
      fetchCustomBudget();
    }
  }, [clientId]);

  return {
    customBudget,
    isUsingCustomBudgetInReview,
    isLoadingCustomBudget
  };
};
