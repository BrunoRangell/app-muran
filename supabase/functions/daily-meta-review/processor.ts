
import { 
  createSupabaseClient,
  fetchClientData, 
  fetchMetaAccountDetails, 
  fetchActiveCustomBudget,
  checkExistingReview,
  updateExistingReview,
  createNewReview,
  updateClientCurrentReview 
} from "./database.ts";
import { calculateIdealDailyBudget } from "./budget.ts";
import { validateRequest } from "./validators.ts";

// Definição de tipos
interface RequestBody {
  clientId: string;
  metaAccountId?: string;
  reviewDate?: string;
  metaAccountName?: string;
  metaBudgetAmount?: number;
  // Dados reais da API Meta (quando disponíveis)
  realApiData?: {
    totalSpent: number;
    dailyBudget: number;
  };
  // Parâmetros para busca de dados da API
  accessToken?: string;
  fetchRealData?: boolean;
}

interface ReviewResult {
  success: boolean;
  reviewId: number | null;
  clientId: string;
  accountId?: string | null;
  accountName?: string;
  idealDailyBudget?: number;
  totalSpent?: number;
  budgetAmount?: number;
  usingCustomBudget?: boolean;
  dataSource?: string; // "api" | "zero" | "provided"
  error?: string;
}

// Função para verificar se token Meta está configurado
async function checkMetaToken(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { data: tokenData, error: tokenError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();

    if (tokenError) {
      console.error("❌ Erro ao verificar token Meta:", tokenError.message);
      return false;
    }

    if (!tokenData?.value) {
      console.warn("⚠️ Token Meta não encontrado ou vazio");
      return false;
    }

    console.log("✅ Token Meta configurado corretamente");
    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar token Meta:", error);
    return false;
  }
}

// Função para calcular o orçamento diário total baseado em campanhas e adsets ativos
async function calculateTotalBudgetMeta(accessToken: string, accountId: string): Promise<number> {
  try {
    console.log(`💰 Calculando orçamento diário total para conta ${accountId}...`);
    
    // Buscar campanhas ativas
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns`;
    const campaignsParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'status,daily_budget,id,name,effective_status'
    });
    
    console.log(`🔍 Buscando campanhas: ${campaignsUrl}?${campaignsParams}`);
    
    const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error(`❌ Erro ao buscar campanhas:`, {
        status: campaignsResponse.status,
        error: errorText
      });
      return 0;
    }
    
    const campaignsData = await campaignsResponse.json();
    console.log(`📊 Campanhas encontradas: ${campaignsData.data?.length || 0}`);
    
    let totalBudget = 0;
    const activeCampaigns = campaignsData.data?.filter(campaign => 
      campaign.status === 'ACTIVE' && campaign.effective_status === 'ACTIVE'
    ) || [];
    
    console.log(`✅ Campanhas ativas: ${activeCampaigns.length}`);
    
    // Para cada campanha ativa, processar orçamento
    for (const campaign of activeCampaigns) {
      console.log(`🔍 Processando campanha: ${campaign.name} (${campaign.id})`);
      
      // Se a campanha tem orçamento diário definido, somar
      if (campaign.daily_budget) {
        const campaignBudget = parseFloat(campaign.daily_budget) / 100; // Meta retorna em centavos
        totalBudget += campaignBudget;
        console.log(`💵 Orçamento da campanha ${campaign.name}: ${campaignBudget}`);
      }
      
      // Buscar adsets da campanha para verificar orçamentos a nível de adset
      try {
        const adsetsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/adsets`;
        const adsetsParams = new URLSearchParams({
          access_token: accessToken,
          fields: 'daily_budget,status,name,end_time,effective_status'
        });
        
        const adsetsResponse = await fetch(`${adsetsUrl}?${adsetsParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (adsetsResponse.ok) {
          const adsetsData = await adsetsResponse.json();
          const activeAdsets = adsetsData.data?.filter(adset => {
            // Verificar se o adset está ativo e não expirou
            if (adset.status !== 'ACTIVE' || adset.effective_status !== 'ACTIVE') {
              return false;
            }
            
            // Verificar se não expirou (se tem end_time)
            if (adset.end_time) {
              const endDate = new Date(adset.end_time);
              const now = new Date();
              if (endDate <= now) {
                return false;
              }
            }
            
            return true;
          }) || [];
          
          console.log(`📱 Adsets ativos na campanha ${campaign.name}: ${activeAdsets.length}`);
          
          // Somar orçamentos dos adsets ativos
          for (const adset of activeAdsets) {
            if (adset.daily_budget) {
              const adsetBudget = parseFloat(adset.daily_budget) / 100; // Meta retorna em centavos
              totalBudget += adsetBudget;
              console.log(`💵 Orçamento do adset ${adset.name}: ${adsetBudget}`);
            }
          }
        } else {
          console.warn(`⚠️ Não foi possível buscar adsets da campanha ${campaign.id}`);
        }
      } catch (adsetError) {
        console.error(`❌ Erro ao buscar adsets da campanha ${campaign.id}:`, adsetError);
      }
    }
    
    console.log(`✅ Orçamento diário total calculado: ${totalBudget}`);
    return totalBudget;
    
  } catch (error) {
    console.error(`❌ Erro ao calcular orçamento total:`, error);
    return 0;
  }
}

// Função para buscar dados reais da API Meta
async function fetchMetaApiData(accessToken: string, accountId: string): Promise<{ totalSpent: number; dailyBudget: number } | null> {
  try {
    console.log(`🔍 Tentando buscar dados reais da API Meta para conta ${accountId}...`);
    
    if (!accessToken) {
      console.warn("⚠️ Token de acesso não fornecido - usando valores zerados");
      return null;
    }
    
    // Definir período para busca (mês atual)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date();
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    console.log(`📅 Buscando dados do período: ${startDate} a ${endDate}`);
    
    // Buscar insights da conta (gastos)
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights`;
    const insightsParams = new URLSearchParams({
      access_token: accessToken,
      time_range: JSON.stringify({
        since: startDate,
        until: endDate
      }),
      fields: 'spend',
      level: 'account'
    });
    
    console.log(`🌐 Fazendo requisição para API Meta (insights): ${insightsUrl}?${insightsParams}`);
    
    const insightsResponse = await fetch(`${insightsUrl}?${insightsParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!insightsResponse.ok) {
      const errorText = await insightsResponse.text();
      console.error(`❌ Erro na API Meta (insights):`, {
        status: insightsResponse.status,
        statusText: insightsResponse.statusText,
        error: errorText
      });
      return null;
    }
    
    const insightsData = await insightsResponse.json();
    console.log(`📊 Resposta da API Meta (insights):`, insightsData);
    
    // Extrair dados de gastos
    const totalSpent = insightsData.data && insightsData.data.length > 0 
      ? parseFloat(insightsData.data[0].spend || '0') 
      : 0;
    
    // Buscar orçamento diário real das campanhas e adsets ativos
    const dailyBudget = await calculateTotalBudgetMeta(accessToken, accountId);
    
    console.log(`✅ Dados extraídos da API Meta:`, {
      totalSpent,
      dailyBudget,
      source: "API real - campanhas e adsets ativos",
      period: `${startDate} a ${endDate}`
    });
    
    return { totalSpent, dailyBudget };
    
  } catch (error) {
    console.error(`❌ Erro ao buscar dados da API Meta:`, error);
    return null;
  }
}

// Função principal que processa a solicitação de revisão
export async function processReviewRequest(req: Request): Promise<ReviewResult> {
  try {
    const supabase = createSupabaseClient();
    
    // Validar requisição
    const validationError = validateRequest(req);
    if (validationError) {
      return {
        success: false,
        reviewId: null,
        clientId: "",
        error: "Requisição inválida"
      };
    }
    
    // Extrair dados do corpo da requisição
    const requestBody: RequestBody = await req.json();
    const { 
      clientId, 
      metaAccountId, 
      reviewDate = new Date().toISOString().split("T")[0],
      metaAccountName,
      metaBudgetAmount,
      realApiData,
      accessToken,
      fetchRealData = false
    } = requestBody;

    console.log(`🚀 Iniciando revisão META para cliente ${clientId}`, {
      metaAccountId: metaAccountId || "padrão",
      reviewDate,
      fetchRealData,
      hasAccessToken: !!accessToken,
      hasRealApiData: !!realApiData
    });

    // Verificar se o clientId foi fornecido
    if (!clientId) {
      return {
        success: false,
        reviewId: null,
        clientId: "",
        error: "ID do cliente é obrigatório"
      };
    }

    // Buscar informações do cliente
    const client = await fetchClientData(supabase, clientId);

    // Verificar se token Meta está configurado
    const hasMetaToken = await checkMetaToken();
    if (!hasMetaToken) {
      console.warn("⚠️ Token Meta não configurado - usando valores zerados");
    }

    // Valores padrão
    let accountId = metaAccountId || client.meta_account_id;
    let budgetAmount = client.meta_ads_budget;
    let accountName = "Conta Principal";
    
    // Verificar se devemos usar uma conta Meta específica
    if (metaAccountId) {
      // Se temos o nome e orçamento enviados na requisição
      if (metaAccountName && metaBudgetAmount !== undefined) {
        accountName = metaAccountName;
        budgetAmount = metaBudgetAmount;
      } else {
        // Buscar detalhes da conta Meta específica
        const metaAccount = await fetchMetaAccountDetails(supabase, clientId, metaAccountId);
        if (metaAccount) {
          accountName = metaAccount.account_name || "Conta Secundária";
          budgetAmount = metaAccount.budget_amount || client.meta_ads_budget;
        }
      }
    }

    // Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split("T")[0];
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);

    const usingCustomBudget = !!customBudget;
    
    // Se estiver usando orçamento personalizado e não uma conta específica
    if (usingCustomBudget && !metaAccountId) {
      budgetAmount = customBudget?.budget_amount || budgetAmount;
    }

    console.log(`💰 Configuração de orçamento:`, {
      usingCustomBudget,
      budgetAmount,
      accountName,
      accountId,
      hasMetaToken,
      fetchRealData
    });

    // LÓGICA DE BUSCA DE DADOS MELHORADA - PRIORIZAR DADOS REAIS
    let totalSpent = 0;
    let currentDailyBudget = 0;
    let dataSource = "zero";

    // Prioridade 1: Dados fornecidos diretamente na requisição
    if (realApiData) {
      console.log("📥 Usando dados reais fornecidos na requisição:", realApiData);
      totalSpent = realApiData.totalSpent || 0;
      currentDailyBudget = realApiData.dailyBudget || 0;
      dataSource = "provided";
    }
    // Prioridade 2: Buscar dados da API se solicitado E token disponível E conta configurada
    else if (fetchRealData && hasMetaToken && accountId) {
      console.log("🔄 Tentando buscar dados reais da API Meta...");
      
      // Buscar token do banco
      const { data: tokenData } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .maybeSingle();
      
      if (tokenData?.value) {
        console.log("🔑 Token Meta encontrado, fazendo chamada para API...");
        const apiData = await fetchMetaApiData(tokenData.value, accountId);
        if (apiData) {
          totalSpent = apiData.totalSpent;
          // Para o orçamento diário atual, vamos manter 0 já que a API não fornece mais
          currentDailyBudget = 0;
          dataSource = "api";
          console.log("✅ Dados obtidos da API Meta com sucesso!", {
            totalSpent,
            note: "Orçamento diário não disponível via API - usando configuração do sistema",
            accountId
          });
        } else {
          console.warn("⚠️ Falha ao obter dados da API - usando valores zerados");
          dataSource = "zero";
        }
      } else {
        console.warn("⚠️ Token Meta não encontrado no banco - usando valores zerados");
        dataSource = "zero";
      }
    }
    // Prioridade 3: Valores zerados (fallback)
    else {
      const reason = !fetchRealData ? "fetchRealData=false" : 
                     !hasMetaToken ? "token não configurado" : 
                     !accountId ? "conta não configurada" : "motivo desconhecido";
      console.log(`🔄 Usando valores zerados (${reason})`);
      totalSpent = 0;
      currentDailyBudget = 0;
      dataSource = "zero";
      
      if (!hasMetaToken && fetchRealData) {
        console.log("💡 Dica: Configure o token Meta nas configurações para buscar dados reais");
      }
    }

    // Calcular orçamento diário ideal baseado nos dados obtidos
    const roundedIdealDailyBudget = calculateIdealDailyBudget(budgetAmount, totalSpent);
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    
    // Preparar dados para a revisão (apenas campos que existem na tabela)
    const reviewData = {
      meta_daily_budget_current: currentDailyBudget,
      meta_total_spent: totalSpent,
      meta_account_id: accountId || null,
      meta_account_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null
    };
    
    console.log("💾 Dados para salvar na revisão:", {
      ...reviewData,
      idealDailyBudget: roundedIdealDailyBudget,
      dataSource,
      hasMetaToken,
      fetchRealData
    });
    
    if (existingReview) {
      console.log("🔄 Atualizando revisão existente:", existingReview.id);
      
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      
      reviewId = existingReview.id;
      console.log(`✅ Revisão existente atualizada: ${reviewId}`);
    } else {
      console.log("➕ Criando nova revisão");
      
      // Criar nova revisão
      reviewId = await createNewReview(supabase, clientId, reviewDate, reviewData);
      console.log(`✅ Nova revisão criada: ${reviewId}`);
    }

    // Registrar na tabela client_current_reviews para referência rápida ao estado atual
    await updateClientCurrentReview(supabase, clientId, reviewDate, reviewData);

    const result = {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      idealDailyBudget: roundedIdealDailyBudget,
      totalSpent,
      budgetAmount,
      usingCustomBudget,
      dataSource
    };

    console.log("🎉 Revisão concluída com sucesso:", result);

    return result;
  } catch (error) {
    console.error("💥 Erro na função Edge META:", error.message);
    return {
      success: false,
      reviewId: null,
      clientId: (error as any).clientId || "",
      error: error.message
    };
  }
}
