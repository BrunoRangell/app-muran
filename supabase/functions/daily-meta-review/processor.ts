
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
    
    // Buscar insights da conta
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
    
    console.log(`🌐 Fazendo requisição para API Meta: ${insightsUrl}?${insightsParams}`);
    
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
    
    // Buscar informações da conta para orçamento diário
    const accountUrl = `https://graph.facebook.com/v18.0/act_${accountId}`;
    const accountParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'daily_budget_limit,account_status'
    });
    
    const accountResponse = await fetch(`${accountUrl}?${accountParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error(`❌ Erro na API Meta (account):`, {
        status: accountResponse.status,
        statusText: accountResponse.statusText,
        error: errorText
      });
      return null;
    }
    
    const accountData = await accountResponse.json();
    console.log(`📊 Resposta da API Meta (account):`, accountData);
    
    // Extrair dados
    const totalSpent = insightsData.data && insightsData.data.length > 0 
      ? parseFloat(insightsData.data[0].spend || '0') 
      : 0;
      
    const dailyBudget = accountData.daily_budget_limit 
      ? parseFloat(accountData.daily_budget_limit) / 100 // Meta retorna em centavos
      : 0;
    
    console.log(`✅ Dados extraídos da API Meta:`, {
      totalSpent,
      dailyBudget,
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
      hasMetaToken
    });

    // LÓGICA DE BUSCA DE DADOS
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
    // Prioridade 2: Buscar dados da API se solicitado, token disponível e conta configurada
    else if (fetchRealData && hasMetaToken && accountId) {
      console.log("🔄 Tentando buscar dados reais da API Meta...");
      
      // Buscar token do banco
      const { data: tokenData } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .maybeSingle();
      
      if (tokenData?.value) {
        const apiData = await fetchMetaApiData(tokenData.value, accountId);
        if (apiData) {
          totalSpent = apiData.totalSpent;
          currentDailyBudget = apiData.dailyBudget;
          dataSource = "api";
          console.log("✅ Dados obtidos da API Meta com sucesso!");
        } else {
          console.warn("⚠️ Falha ao obter dados da API - usando valores zerados");
          dataSource = "zero";
        }
      }
    }
    // Prioridade 3: Valores zerados (padrão)
    else {
      console.log("🔄 Usando valores zerados (sem dados da API disponíveis)");
      totalSpent = 0;
      currentDailyBudget = 0;
      dataSource = "zero";
      
      if (!hasMetaToken) {
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
      hasMetaToken
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
