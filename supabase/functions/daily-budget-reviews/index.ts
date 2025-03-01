
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { method } = payload;

    console.log("Payload received:", JSON.stringify(payload, null, 2));

    let data;
    if (method === "getMetaAdsData") {
      data = await getMetaAdsData(payload);
    } else {
      throw new Error("Method not supported");
    }

    console.log("Response data:", JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error.message);
    console.error("Error stack:", error.stack);
    
    // Construir uma resposta de erro mais detalhada
    const errorResponse = {
      success: false,
      message: `Erro: ${error.message}`,
      error: {
        name: error.name,
        details: error.stack
      },
      meta: {
        dailyBudget: 0,
        totalSpent: 0,
        accountId: payload?.metaAccountId || "desconhecido",
        dateRange: payload?.dateRange || {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        campaigns: []
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Função para obter dados atualizados do Meta Ads
const getMetaAdsData = async (payload: any) => {
  console.log("Iniciando getMetaAdsData com payload:", JSON.stringify(payload, null, 2));
  
  const { 
    accessToken, 
    metaAccountId, 
    clientId, 
    clientName,
    reviewDate,
    dateRange
  } = payload;

  // Verificar parâmetros obrigatórios
  if (!accessToken) throw new Error("Token de acesso não fornecido");
  if (!metaAccountId) throw new Error("ID da conta Meta não fornecido");
  if (!clientId) throw new Error("ID do cliente não fornecido");

  try {
    // Variáveis para armazenar os dados
    let totalSpent = 0;
    let dailyBudget = 0;
    let campaigns = [];

    // Usar as datas fornecidas no payload ou gerar datas do mês atual
    const currentDate = new Date();
    const startDate = dateRange?.start || new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log(`Período de análise: ${startDate} a ${endDate}`);
    console.log(`Usando token de acesso: ${accessToken.substring(0, 5)}...`);
    console.log(`ID da conta Meta: ${metaAccountId}`);

    // 1. Buscar informações da conta Meta Ads
    console.log("Obtendo informações da conta Meta Ads...");
    const accountUrl = `https://graph.facebook.com/v18.0/${metaAccountId}?fields=name,account_status,amount_spent,balance,spend_cap,daily_spend_limit&access_token=${accessToken}`;
    
    const accountResponse = await fetch(accountUrl);
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error("Erro ao obter detalhes da conta:", errorText);
      throw new Error(`Falha ao obter detalhes da conta: ${accountResponse.statusText}`);
    }
    
    const accountData = await accountResponse.json();
    console.log("Dados da conta obtidos:", JSON.stringify(accountData, null, 2));
    
    // Capturar o orçamento diário da conta
    dailyBudget = accountData.daily_spend_limit ? parseFloat(accountData.daily_spend_limit) / 100 : 0;
    
    // 2. Buscar campanhas da conta
    console.log("Obtendo campanhas da conta Meta Ads...");
    const campaignsUrl = `https://graph.facebook.com/v18.0/${metaAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,spend,objective&date_preset=this_month&access_token=${accessToken}`;
    
    const campaignsResponse = await fetch(campaignsUrl);
    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error("Erro ao obter campanhas:", errorText);
      throw new Error(`Falha ao obter campanhas: ${campaignsResponse.statusText}`);
    }
    
    const campaignsData = await campaignsResponse.json();
    console.log("Dados de campanhas obtidos:", JSON.stringify(campaignsData, null, 2));
    
    // Processar campanhas obtidas
    if (campaignsData.data && Array.isArray(campaignsData.data)) {
      campaigns = campaignsData.data.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend: campaign.spend ? parseFloat(campaign.spend) : 0
      }));
      
      // Calcular o total gasto somando os gastos de todas as campanhas
      totalSpent = campaigns.reduce((total, campaign) => total + (campaign.spend || 0), 0);
      
      console.log(`Total de ${campaigns.length} campanhas obtidas`);
      console.log(`Total gasto calculado: ${totalSpent}`);
    } else {
      console.log("Nenhuma campanha encontrada ou formato inesperado de resposta");
      campaigns = [];
    }
    
    // 3. Salvar os dados na revisão diária
    console.log("Salvando dados da revisão no banco de dados...");
    const supabase = getSupabaseAdmin();
    
    // Verificar se já existe uma revisão para esta data e cliente
    const { data: existingReviews, error: queryError } = await supabase
      .from("daily_budget_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .maybeSingle();
    
    if (queryError) {
      console.error("Erro ao verificar revisões existentes:", queryError.message);
    }
    
    let reviewId;
    
    // Se já existe uma revisão, atualizar. Senão, criar nova.
    if (existingReviews?.id) {
      const { error: updateError } = await supabase.rpc(
        "update_daily_budget_review",
        {
          p_id: existingReviews.id,
          p_meta_daily_budget_current: dailyBudget,
          p_meta_total_spent: totalSpent
        }
      );
      
      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError.message);
        throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
      }
      
      reviewId = existingReviews.id;
      console.log("Revisão atualizada com sucesso, ID:", reviewId);
    } else {
      const { data: insertData, error: insertError } = await supabase.rpc(
        "insert_daily_budget_review",
        {
          p_client_id: clientId,
          p_review_date: reviewDate,
          p_meta_daily_budget_current: dailyBudget,
          p_meta_total_spent: totalSpent,
          p_meta_account_id: metaAccountId,
          p_meta_account_name: accountData.name || clientName
        }
      );
      
      if (insertError) {
        console.error("Erro ao criar revisão:", insertError.message);
        throw new Error(`Erro ao criar revisão: ${insertError.message}`);
      }
      
      reviewId = insertData;
      console.log("Revisão salva com sucesso, ID:", reviewId);
    }
    
    // Retornar os dados obtidos
    return {
      success: true,
      reviewId,
      client: {
        id: clientId,
        company_name: clientName,
        meta_account_id: metaAccountId
      },
      meta: {
        totalSpent,
        dailyBudget,
        accountId: metaAccountId,
        dateRange: {
          start: startDate,
          end: endDate
        },
        campaigns
      },
      message: "Análise realizada com sucesso com dados reais do Meta Ads"
    };
  } catch (error) {
    console.error("Erro na análise:", error.message);
    console.error("Stack trace:", error.stack);
    
    // Retornar um objeto com informações detalhadas sobre o erro
    return {
      success: false,
      meta: {
        dailyBudget: 0,
        totalSpent: 0,
        accountId: metaAccountId || "",
        dateRange: {
          start: dateRange?.start || new Date().toISOString().split('T')[0],
          end: dateRange?.end || new Date().toISOString().split('T')[0]
        },
        campaigns: []
      },
      message: `Erro: ${error.message}`
    };
  }
};
