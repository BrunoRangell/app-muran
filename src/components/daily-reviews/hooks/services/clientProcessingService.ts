
import { supabase } from "@/integrations/supabase/client";
import { GoogleReview } from "../types/reviewTypes";

export const processClientReview = async (
  clientId: string,
  accountId: string,
  platform: 'meta' | 'google',
  reviewData: any
): Promise<GoogleReview | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe revisão para hoje
    const { data: existingReview } = await supabase
      .from('budget_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .eq('platform', platform)
      .eq('review_date', today)
      .maybeSingle();
    
    const reviewRecord = {
      client_id: clientId,
      account_id: accountId,
      platform: platform,
      review_date: today,
      daily_budget_current: reviewData.dailyBudget || 0,
      total_spent: reviewData.totalSpent || 0,
      last_five_days_spent: reviewData.lastFiveDaysSpent || 0,
      day_1_spent: reviewData.day1Spent || 0,
      day_2_spent: reviewData.day2Spent || 0,
      day_3_spent: reviewData.day3Spent || 0,
      day_4_spent: reviewData.day4Spent || 0,
      day_5_spent: reviewData.day5Spent || 0,
      using_custom_budget: reviewData.usingCustomBudget || false,
      custom_budget_id: reviewData.customBudgetId || null,
      custom_budget_amount: reviewData.customBudgetAmount || null,
      custom_budget_start_date: reviewData.customBudgetStartDate || null,
      custom_budget_end_date: reviewData.customBudgetEndDate || null,
      warning_ignored_today: reviewData.warningIgnoredToday || false,
      warning_ignored_date: reviewData.warningIgnoredDate || null,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existingReview) {
      // Atualizar revisão existente
      const { data, error } = await supabase
        .from('budget_reviews')
        .update(reviewRecord)
        .eq('id', existingReview.id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar revisão:", error);
        return null;
      }
      
      result = data;
    } else {
      // Criar nova revisão
      const { data, error } = await supabase
        .from('budget_reviews')
        .insert({
          ...reviewRecord,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao criar revisão:", error);
        return null;
      }
      
      result = data;
    }
    
    // Converter para o formato GoogleReview
    const googleReview: GoogleReview = {
      id: result.id,
      client_id: result.client_id,
      review_date: result.review_date,
      google_daily_budget_current: result.daily_budget_current,
      google_total_spent: result.total_spent,
      google_last_five_days_spent: result.last_five_days_spent,
      google_day_1_spent: result.day_1_spent,
      google_day_2_spent: result.day_2_spent,
      google_day_3_spent: result.day_3_spent,
      google_day_4_spent: result.day_4_spent,
      google_day_5_spent: result.day_5_spent,
      created_at: result.created_at,
      updated_at: result.updated_at,
      using_custom_budget: result.using_custom_budget,
      custom_budget_amount: result.custom_budget_amount,
      custom_budget_id: result.custom_budget_id,
      custom_budget_start_date: result.custom_budget_start_date,
      custom_budget_end_date: result.custom_budget_end_date,
      warning_ignored_today: result.warning_ignored_today,
      warning_ignored_date: result.warning_ignored_date,
      client_account_id: result.account_id,
      // Campos compatíveis para evitar erros
      meta_account_id: result.account_id,
      meta_daily_budget_current: result.daily_budget_current,
      meta_total_spent: result.total_spent,
      idealDailyBudget: result.daily_budget_current,
      google_account_id: result.account_id,
      google_account_name: `Conta ${result.account_id}`,
      account_display_name: `Conta ${result.account_id}`
    };
    
    return googleReview;
    
  } catch (error) {
    console.error("Erro ao processar revisão do cliente:", error);
    return null;
  }
};

export const batchProcessClients = async (
  clientIds: string[],
  platform: 'meta' | 'google'
): Promise<{ success: number; errors: number }> => {
  let success = 0;
  let errors = 0;
  
  for (const clientId of clientIds) {
    try {
      // Buscar contas do cliente para a plataforma especificada
      const { data: accounts } = await supabase
        .from('client_accounts')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .eq('status', 'active');
      
      if (!accounts || accounts.length === 0) {
        console.warn(`Cliente ${clientId} não possui contas ${platform} ativas`);
        continue;
      }
      
      // Processar cada conta
      for (const account of accounts) {
        const mockReviewData = {
          dailyBudget: account.budget_amount || 0,
          totalSpent: 0,
          lastFiveDaysSpent: 0,
          usingCustomBudget: false
        };
        
        const result = await processClientReview(
          clientId,
          account.id,
          platform,
          mockReviewData
        );
        
        if (result) {
          success++;
        } else {
          errors++;
        }
      }
      
    } catch (error) {
      console.error(`Erro ao processar cliente ${clientId}:`, error);
      errors++;
    }
  }
  
  return { success, errors };
};
