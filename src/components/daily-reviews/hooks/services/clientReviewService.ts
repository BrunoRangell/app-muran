
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { prepareCustomBudgetInfo } from "./customBudgetService";

/**
 * Salva uma nova revisão de orçamento para um cliente
 */
export async function saveClientReview(clientId: string, reviewData: any, customBudget: any = null) {
  try {
    console.log(`Salvando revisão para cliente ${clientId}`);
    const reviewDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
    
    // Verificar se há orçamento personalizado ativo
    const customBudgetInfo = prepareCustomBudgetInfo(customBudget);
    
    // Verificar se precisa de ajuste de orçamento (diferença >= 5)
    const currentDailyBudget = reviewData.meta_daily_budget_current || 0;
    const idealDailyBudget = reviewData.meta_daily_budget_ideal || 0;
    const budgetDifference = idealDailyBudget - currentDailyBudget;
    const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
    
    // Preparar dados para inserção
    const reviewPayload = {
      client_id: clientId,
      review_date: reviewDate,
      ...reviewData,
      ...customBudgetInfo,
      // Adicionar campo de ajuste necessário
      needsBudgetAdjustment
    };
    
    // Inserir na tabela de revisões
    const { data, error } = await supabase
      .from("meta_reviews")
      .insert(reviewPayload)
      .select("*")
      .single();
      
    if (error) {
      console.error("Erro ao salvar revisão:", error);
      throw error;
    }
    
    console.log("Revisão salva com sucesso:", data);
    return data;
  } catch (error) {
    console.error("Erro ao salvar revisão:", error);
    throw error;
  }
}
