
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Tipos para operações de banco de dados
export interface ClientData {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
}

export interface MetaAccount {
  account_id: string;
  account_name: string;
  budget_amount: number;
}

export interface CustomBudget {
  id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
}

export interface ReviewData {
  meta_daily_budget_current: number;
  meta_total_spent: number;
  meta_account_id: string | null;
  client_account_id: string | null;
  meta_account_name: string;
  using_custom_budget: boolean;
  custom_budget_id: string | null;
  custom_budget_amount: number | null;
  custom_budget_start_date?: string | null;
  custom_budget_end_date?: string | null;
}

// Criação do cliente Supabase
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Buscar dados do cliente
export async function fetchClientData(supabase: any, clientId: string): Promise<ClientData> {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError) {
    throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
  }

  return client;
}

// Buscar detalhes da conta Meta específica
export async function fetchMetaAccountDetails(
  supabase: any, 
  clientId: string, 
  accountId: string
): Promise<MetaAccount | null> {
  console.log(`Buscando detalhes de conta Meta específica: ${accountId} para cliente ${clientId}`);
  
  const { data: metaAccount, error: accountError } = await supabase
    .from("client_meta_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (accountError) {
    console.error(`Erro ao buscar conta Meta: ${accountError.message}`);
    return null;
  }

  return metaAccount;
}

// Buscar orçamento personalizado ativo
export async function fetchActiveCustomBudget(
  supabase: any, 
  clientId: string,
  today: string
): Promise<CustomBudget | null> {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId}`);
  
  const { data: customBudget, error: customBudgetError } = await supabase
    .from("meta_custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (customBudgetError) {
    console.error(`Erro ao buscar orçamento personalizado: ${customBudgetError.message}`);
    return null;
  }

  return customBudget;
}

// Verificar revisão existente
export async function checkExistingReview(
  supabase: any, 
  clientId: string, 
  accountId: string | null, 
  reviewDate: string
) {
  console.log(`Verificando revisão existente para cliente ${clientId} e conta ${accountId || ""} na data ${reviewDate}`);
  
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("daily_budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate)
    .or(`meta_account_id.eq.${accountId || ""},client_account_id.eq.${accountId || ""}`)
    .maybeSingle();

  if (existingReviewError && existingReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
  }

  return existingReview;
}

// Atualizar revisão existente
export async function updateExistingReview(
  supabase: any, 
  reviewId: number, 
  reviewData: ReviewData
): Promise<void> {
  console.log(`Atualizando revisão existente: ${reviewId}`);
  
  const { error: updateError } = await supabase
    .from("daily_budget_reviews")
    .update({
      ...reviewData,
      updated_at: new Date().toISOString()
    })
    .eq("id", reviewId);

  if (updateError) {
    throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
  }
}

// Criar nova revisão
export async function createNewReview(
  supabase: any, 
  clientId: string,
  reviewDate: string,
  reviewData: ReviewData
): Promise<number> {
  console.log("Criando nova revisão");
  
  const { data: newReview, error: insertError } = await supabase
    .from("daily_budget_reviews")
    .insert({
      ...reviewData,
      client_id: clientId,
      review_date: reviewDate
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
  }
  
  return newReview.id;
}

// Atualizar ou criar revisão atual do cliente
export async function updateClientCurrentReview(
  supabase: any, 
  clientId: string, 
  reviewDate: string,
  reviewData: ReviewData
): Promise<void> {
  try {
    // Verificar se já existe revisão atual para este cliente
    const { data: currentReview, error: currentReviewError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (currentReviewError && currentReviewError.code !== "PGRST116") {
      console.error(`Erro ao verificar revisão atual: ${currentReviewError.message}`);
    }

    const currentReviewData = {
      client_id: clientId,
      review_date: reviewDate,
      ...reviewData
    };

    if (currentReview) {
      // Atualizar revisão atual
      const { error: updateCurrentError } = await supabase
        .from("client_current_reviews")
        .update(currentReviewData)
        .eq("id", currentReview.id);

      if (updateCurrentError) {
        console.error(`Erro ao atualizar revisão atual: ${updateCurrentError.message}`);
      }
    } else {
      // Inserir nova revisão atual
      const { error: insertCurrentError } = await supabase
        .from("client_current_reviews")
        .insert(currentReviewData);

      if (insertCurrentError) {
        console.error(`Erro ao inserir revisão atual: ${insertCurrentError.message}`);
      }
    }
  } catch (error) {
    console.error(`Erro ao atualizar revisão atual do cliente: ${error.message}`);
  }
}

// Função para buscar dados reais da API Meta Ads
export async function fetchMetaAdsData(accessToken: string, accountId: string, dateRange: { start: string, end: string }) {
  console.log(`DIAGNÓSTICO API META: Iniciando busca para conta ${accountId}`);
  console.log(`DIAGNÓSTICO API META: Período de ${dateRange.start} até ${dateRange.end}`);
  console.log(`DIAGNÓSTICO API META: Token (primeiros 20 chars): ${accessToken.substring(0, 20)}...`);
  
  try {
    // URL da API Meta Ads para buscar insights da conta
    const baseUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights`;
    const params = new URLSearchParams({
      access_token: accessToken,
      time_range: JSON.stringify({
        since: dateRange.start,
        until: dateRange.end
      }),
      fields: 'spend,account_id,date_start,date_stop',
      level: 'account'
    });
    
    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log(`DIAGNÓSTICO API META: URL da requisição: ${apiUrl.replace(accessToken, '[TOKEN_HIDDEN]')}`);
    
    const response = await fetch(apiUrl);
    console.log(`DIAGNÓSTICO API META: Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DIAGNÓSTICO API META: Erro na API (${response.status}):`, errorText);
      throw new Error(`Erro na API Meta Ads: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`DIAGNÓSTICO API META: Resposta da API:`, JSON.stringify(data, null, 2));
    
    // Calcular total gasto
    let totalSpent = 0;
    if (data.data && Array.isArray(data.data)) {
      totalSpent = data.data.reduce((sum: number, item: any) => {
        const spend = parseFloat(item.spend || '0');
        console.log(`DIAGNÓSTICO API META: Gasto do período ${item.date_start}-${item.date_stop}: ${spend}`);
        return sum + spend;
      }, 0);
    }
    
    console.log(`DIAGNÓSTICO API META: Total gasto calculado: ${totalSpent}`);
    
    // Buscar orçamento diário atual das campanhas ativas
    let currentDailyBudget = 0;
    try {
      const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`;
      const campaignParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'daily_budget,status,effective_status',
        effective_status: '["ACTIVE"]'
      });
      
      const campaignResponse = await fetch(`${campaignsUrl}?${campaignParams.toString()}`);
      console.log(`DIAGNÓSTICO API META: Status busca campanhas: ${campaignResponse.status}`);
      
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        console.log(`DIAGNÓSTICO API META: Campanhas encontradas:`, JSON.stringify(campaignData, null, 2));
        
        if (campaignData.data && Array.isArray(campaignData.data)) {
          currentDailyBudget = campaignData.data.reduce((sum: number, campaign: any) => {
            const budget = parseFloat(campaign.daily_budget || '0') / 100; // Meta retorna em centavos
            console.log(`DIAGNÓSTICO API META: Campanha ${campaign.id} - Orçamento diário: ${budget}`);
            return sum + budget;
          }, 0);
        }
      } else {
        const campaignError = await campaignResponse.text();
        console.error(`DIAGNÓSTICO API META: Erro ao buscar campanhas:`, campaignError);
      }
    } catch (campaignError) {
      console.error(`DIAGNÓSTICO API META: Exceção ao buscar campanhas:`, campaignError);
    }
    
    console.log(`DIAGNÓSTICO API META: Orçamento diário atual total: ${currentDailyBudget}`);
    
    return {
      totalSpent,
      dailyBudget: currentDailyBudget
    };
  } catch (error) {
    console.error(`DIAGNÓSTICO API META: Erro geral na busca de dados:`, error);
    throw error;
  }
}
