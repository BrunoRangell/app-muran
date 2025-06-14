
import { supabase } from "@/lib/supabase";
import { GoogleReview } from "../types/reviewTypes";

export class ClientReviewService {
  static async getLatestGoogleReview(clientId: string, accountId?: string): Promise<GoogleReview | null> {
    try {
      let query = supabase
        .from('google_ads_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(1);

      if (accountId) {
        query = query.eq('google_account_id', accountId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Erro ao buscar última revisão Google:', error);
        return null;
      }

      if (!data) return null;

      // Garantir que o objeto tenha todas as propriedades necessárias do tipo GoogleReview
      return {
        id: data.id,
        client_id: data.client_id,
        review_date: data.review_date,
        google_daily_budget_current: data.google_daily_budget_current || 0,
        google_total_spent: data.google_total_spent || 0,
        google_last_five_days_spent: data.google_last_five_days_spent,
        google_account_id: data.google_account_id,
        google_account_name: data.google_account_name,
        client_account_id: data.client_account_id,
        account_display_name: data.account_display_name,
        created_at: data.created_at,
        updated_at: data.updated_at,
        using_custom_budget: data.using_custom_budget,
        custom_budget_amount: data.custom_budget_amount,
        custom_budget_id: data.custom_budget_id,
        custom_budget_end_date: data.custom_budget_end_date,
        custom_budget_start_date: data.custom_budget_start_date,
        google_day_1_spent: data.google_day_1_spent,
        google_day_2_spent: data.google_day_2_spent,
        google_day_3_spent: data.google_day_3_spent,
        google_day_4_spent: data.google_day_4_spent,
        google_day_5_spent: data.google_day_5_spent,
        // Propriedades compatíveis para evitar erros
        meta_account_id: undefined,
        meta_daily_budget_current: undefined,
        meta_total_spent: undefined,
        idealDailyBudget: undefined
      };

    } catch (error) {
      console.error('Erro inesperado ao buscar revisão Google:', error);
      return null;
    }
  }

  static async getLatestMetaReview(clientId: string, accountId?: string) {
    try {
      let query = supabase
        .from('daily_budget_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false })
        .limit(1);

      if (accountId) {
        query = query.eq('meta_account_id', accountId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Erro ao buscar última revisão Meta:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro inesperado ao buscar revisão Meta:', error);
      return null;
    }
  }

  static async getAllGoogleReviews(clientId: string, accountId?: string) {
    try {
      let query = supabase
        .from('google_ads_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false });

      if (accountId) {
        query = query.eq('google_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar todas as revisões Google:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar todas as revisões Google:', error);
      return [];
    }
  }

  static async getAllMetaReviews(clientId: string, accountId?: string) {
    try {
      let query = supabase
        .from('daily_budget_reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('review_date', { ascending: false });

      if (accountId) {
        query = query.eq('meta_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar todas as revisões Meta:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro inesperado ao buscar todas as revisões Meta:', error);
      return [];
    }
  }
}
