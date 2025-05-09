
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { formatResponse, formatErrorResponse } from "./response.ts";
import { getSupabaseClient } from "./database.ts";

serve(async (req) => {
  // Tratar CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const requestBody = await req.json();
    const { 
      clientId,
      googleAccountId,
      dailyBudget,
      totalSpent,
      lastFiveDaysSpent,
      accountName
    } = requestBody;

    if (!clientId || !dailyBudget) {
      return formatErrorResponse("Dados insuficientes para criar revisão", 400);
    }

    const supabase = getSupabaseClient();
    const reviewDate = new Date().toISOString().split('T')[0];

    // Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split('T')[0];
    
    const { data: customBudget, error: customBudgetError } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("platform", "google")
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
      
    if (customBudgetError) {
      console.warn("Erro ao verificar orçamento personalizado:", customBudgetError.message);
      // Continuar sem orçamento personalizado
    }
    
    // Verificar se o orçamento personalizado se aplica a esta conta específica
    let customBudgetToUse = null;
    if (customBudget) {
      if (googleAccountId && customBudget.account_id && customBudget.account_id !== googleAccountId) {
        console.log("Orçamento personalizado existe mas é para outra conta");
      } else {
        customBudgetToUse = customBudget;
        console.log("Aplicando orçamento personalizado:", JSON.stringify(customBudgetToUse));
      }
    }

    // Preparar dados para inserir na tabela
    const payload: any = {
      client_id: clientId,
      review_date: reviewDate,
      google_daily_budget_current: dailyBudget,
      google_total_spent: totalSpent,
      google_last_five_days_spent: lastFiveDaysSpent || null,
      google_account_id: googleAccountId || null,
      google_account_name: accountName || null
    };
    
    // Adicionar dados do orçamento personalizado, se disponível
    if (customBudgetToUse) {
      payload.using_custom_budget = true;
      payload.custom_budget_id = customBudgetToUse.id;
      payload.custom_budget_amount = customBudgetToUse.budget_amount;
      payload.custom_budget_start_date = customBudgetToUse.start_date;
      payload.custom_budget_end_date = customBudgetToUse.end_date;
    } else {
      payload.using_custom_budget = false;
    }

    // Verificar se já existe uma revisão para este cliente/data/conta
    const { data: existingReview, error: existingError } = await supabase
      .from("google_ads_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .eq("google_account_id", googleAccountId || '')
      .maybeSingle();
    
    let result;
    
    // Se já existe, atualizar
    if (existingReview?.id) {
      const { data: updatedReview, error: updateError } = await supabase
        .from("google_ads_reviews")
        .update(payload)
        .eq("id", existingReview.id)
        .select();
        
      if (updateError) {
        return formatErrorResponse(`Erro ao atualizar revisão: ${updateError.message}`, 500);
      }
      
      result = { review: updatedReview[0], updated: true };
    } 
    // Caso contrário, inserir novo
    else {
      const { data: newReview, error: insertError } = await supabase
        .from("google_ads_reviews")
        .insert(payload)
        .select();
        
      if (insertError) {
        return formatErrorResponse(`Erro ao inserir revisão: ${insertError.message}`, 500);
      }
      
      result = { review: newReview[0], updated: false };
    }
    
    // Atualizar também a tabela de revisões atuais (client_current_reviews)
    const currentReviewPayload = {
      ...payload,
      updated_at: new Date().toISOString(),
      meta_daily_budget_current: null,
      meta_total_spent: null
    };
    
    // Verificar se já existe registro para este cliente
    const { data: existingCurrentReview, error: currentError } = await supabase
      .from("client_current_reviews")
      .select("id, meta_daily_budget_current, meta_total_spent")
      .eq("client_id", clientId)
      .maybeSingle();
    
    // Preservar dados do Meta se existirem
    if (existingCurrentReview) {
      if (existingCurrentReview.meta_daily_budget_current) {
        currentReviewPayload.meta_daily_budget_current = existingCurrentReview.meta_daily_budget_current;
      }
      
      if (existingCurrentReview.meta_total_spent) {
        currentReviewPayload.meta_total_spent = existingCurrentReview.meta_total_spent;
      }
    }
    
    // Atualizar ou inserir na tabela de revisões atuais
    if (existingCurrentReview?.id) {
      await supabase
        .from("client_current_reviews")
        .update(currentReviewPayload)
        .eq("id", existingCurrentReview.id);
    } else {
      await supabase
        .from("client_current_reviews")
        .insert(currentReviewPayload);
    }
    
    return formatResponse({
      success: true,
      result,
      meta: {
        dailyBudget,
        totalSpent,
        lastFiveDaysSpent,
        googleAccountId,
        usingCustomBudget: !!customBudgetToUse,
        customBudgetAmount: customBudgetToUse?.budget_amount
      }
    });
    
  } catch (error) {
    console.error(`Erro ao processar revisão: ${error.message}`);
    return formatErrorResponse(`Erro ao processar revisão: ${error.message}`, 500);
  }
});
