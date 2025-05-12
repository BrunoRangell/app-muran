
import { getSupabaseClient } from "./database.ts";

// Processador para requisições de revisão
export async function processReviewRequest(req: Request) {
  try {
    const requestData = await req.json();
    const { 
      clientId,
      metaAccountId, 
      dailyBudget, 
      totalSpent,
      accountName 
    } = requestData;
    
    if (!clientId) {
      return { success: false, error: "ID do cliente não fornecido" };
    }
    
    if (!dailyBudget && dailyBudget !== 0) {
      return { success: false, error: "Orçamento diário não fornecido" };
    }
    
    const supabase = getSupabaseClient();
    const reviewDate = new Date().toISOString().split('T')[0];

    // Verificar se já existe uma revisão para este cliente/data
    const { data: existingReview, error: existingError } = await supabase
      .from("daily_budget_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .eq("meta_account_id", metaAccountId || '')
      .maybeSingle();
    
    if (existingError) {
      console.error("Erro ao verificar revisão existente:", existingError);
      return { success: false, error: `Erro ao verificar revisão existente: ${existingError.message}` };
    }
    
    let result;
    
    // Se já existe revisão, atualizar
    if (existingReview?.id) {
      const { data: updatedReview, error: updateError } = await supabase
        .from("daily_budget_reviews")
        .update({
          meta_daily_budget_current: dailyBudget,
          meta_total_spent: totalSpent,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id)
        .select();
        
      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        return { success: false, error: `Erro ao atualizar revisão: ${updateError.message}` };
      }
      
      result = { review: updatedReview[0], updated: true };
    } 
    // Caso contrário, inserir nova revisão
    else {
      const { data: newReview, error: insertError } = await supabase
        .from("daily_budget_reviews")
        .insert({
          client_id: clientId,
          review_date: reviewDate,
          meta_daily_budget_current: dailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: metaAccountId || null,
          meta_account_name: accountName || null
        })
        .select();
        
      if (insertError) {
        console.error("Erro ao inserir revisão:", insertError);
        return { success: false, error: `Erro ao inserir revisão: ${insertError.message}` };
      }
      
      result = { review: newReview[0], updated: false };
    }
    
    // Atualizar a tabela de revisões correntes
    const { error: currentError } = await supabase
      .from("client_current_reviews")
      .upsert(
        {
          client_id: clientId,
          review_date: reviewDate,
          meta_daily_budget_current: dailyBudget,
          meta_total_spent: totalSpent,
          meta_account_id: metaAccountId || null,
          meta_account_name: accountName || null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "client_id" }
      );
      
    if (currentError) {
      console.error("Aviso: Erro ao atualizar revisão corrente:", currentError);
      // Continuamos mesmo com erro aqui, pois a função principal já foi concluída
    }
    
    return { success: true, result };
  } catch (error) {
    console.error("Erro ao processar requisição de revisão:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido ao processar requisição"
    };
  }
}
