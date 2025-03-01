
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Simula dados de análise para ambiente de desenvolvimento
 */
export const simulateClientAnalysis = async (clientId: string, client: any) => {
  const { toast } = useToast();
  
  // Simular um atraso para dar feedback visual
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Criar uma revisão simulada no banco de dados
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().split('T')[0];
  
  // Verificar se já existe uma revisão para hoje
  const { data: existingReview, error: checkError } = await supabase
    .from("daily_budget_reviews")
    .select("id")
    .eq("client_id", clientId)
    .eq("review_date", formattedDate)
    .maybeSingle();
    
  if (checkError) {
    console.error("Erro ao verificar revisão existente:", checkError);
  }
  
  // Simular valores baseados no exemplo de código do usuário
  // - Obter orçamento mensal do cliente
  // - Calcular um valor gasto que seja realista (entre 1% e 90% do orçamento mensal)
  const monthlyBudget = Number(client.meta_ads_budget);
  const spentPercentage = Math.random() * 0.7 + 0.01; // Entre 1% e 70% do orçamento mensal
  const totalSpent = monthlyBudget * spentPercentage;
  
  // Calcular orçamento diário atual usando o objeto Date
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const currentDay = todayDate.getDate();
  const remainingDays = daysInMonth - currentDay + 1;
  
  const remainingBudget = monthlyBudget - totalSpent;
  const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  
  // Adicionar uma variação ao orçamento diário atual para simular a necessidade de ajuste
  const variationFactor = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
  const currentDailyBudget = idealDailyBudget * variationFactor;
  
  // Dados para inserção/atualização
  const reviewData = {
    client_id: clientId,
    review_date: formattedDate,
    meta_daily_budget_current: currentDailyBudget,
    meta_total_spent: totalSpent,
    meta_account_id: client.meta_account_id,
    meta_account_name: client.company_name,
    updated_at: new Date().toISOString()
  };
  
  let reviewId;
  
  // Se já existe uma revisão para hoje, atualizamos, senão inserimos uma nova
  if (existingReview) {
    console.log("Atualizando revisão existente para hoje");
    
    // Use RPC call para evitar problemas com RLS
    const { data, error } = await supabase.rpc('update_daily_budget_review', {
      p_id: existingReview.id,
      p_meta_daily_budget_current: currentDailyBudget,
      p_meta_total_spent: totalSpent
    });
    
    if (error) {
      console.error("Erro ao atualizar revisão via RPC:", error);
      
      // Fallback para atualização direta se a RPC falhar
      const { data: updateData, error: updateError } = await supabase
        .from("daily_budget_reviews")
        .update(reviewData)
        .eq("id", existingReview.id)
        .select();
        
      if (updateError) {
        console.error("Erro no fallback de atualização:", updateError);
        throw updateError;
      }
    }
    
    reviewId = existingReview.id;
  } else {
    console.log("Criando nova revisão");
    
    // Use RPC call para evitar problemas com RLS
    const { data, error } = await supabase.rpc('insert_daily_budget_review', {
      p_client_id: clientId,
      p_review_date: formattedDate,
      p_meta_daily_budget_current: currentDailyBudget,
      p_meta_total_spent: totalSpent,
      p_meta_account_id: client.meta_account_id,
      p_meta_account_name: client.company_name
    });
    
    if (error) {
      console.error("Erro ao criar revisão via RPC:", error);
      
      // Fallback para inserção direta se a RPC falhar
      const { data: insertData, error: insertError } = await supabase
        .from("daily_budget_reviews")
        .insert(reviewData)
        .select();
        
      if (insertError) {
        console.error("Erro no fallback de inserção:", insertError);
        throw insertError;
      }
      
      reviewId = insertData?.[0]?.id;
    } else {
      reviewId = data;
    }
  }
  
  return {
    status: "success",
    message: "Análise simulada concluída com sucesso",
    client: client,
    reviewId: reviewId
  };
};
