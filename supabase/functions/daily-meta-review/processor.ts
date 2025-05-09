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
import { calculateIdealDailyBudget, clientNeedsAdjustment } from "./budget.ts";
import { fetchMetaAdsData } from "./meta-api.ts";

// Definição de tipos
interface RequestBody {
  clientId: string;
  metaAccountId?: string;
  reviewDate?: string;
  metaAccountName?: string;
  metaBudgetAmount?: number;
  accessToken?: string;
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
  dailyBudgetCurrent?: number;
  usingCustomBudget?: boolean;
  error?: string;
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
      accessToken
    } = requestBody;

    console.log(`Iniciando revisão para cliente ${clientId} com conta Meta ${metaAccountId || "padrão"}`);

    // Verificar se o clientId foi fornecido
    const clientIdError = validateRequest(clientId);
    if (clientIdError) {
      return {
        success: false,
        reviewId: null,
        clientId: "",
        error: "ID do cliente é obrigatório"
      };
    }

    // Buscar informações do cliente
    const client = await fetchClientData(supabase, clientId);

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

    // Verificar se existe orçamento personalizado ativo (primeiro na tabela unificada)
    const today = new Date().toISOString().split("T")[0];
    let customBudget = null;
    
    try {
      // Tentar buscar na tabela unificada primeiro
      const { data: unifiedBudget, error: unifiedError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", "meta")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();
      
      if (!unifiedError && unifiedBudget) {
        customBudget = unifiedBudget;
        console.log("Orçamento personalizado encontrado na tabela unificada:", customBudget);
      } else {
        // Fallback para tabela antiga
        const { data: legacyBudget } = await fetchActiveCustomBudget(supabase, clientId, today);
        if (legacyBudget) {
          customBudget = legacyBudget;
          console.log("Orçamento personalizado encontrado na tabela legacy:", customBudget);
        }
      }
    } catch (budgetError) {
      console.error("Erro ao buscar orçamento personalizado:", budgetError);
    }

    const usingCustomBudget = !!customBudget;
    
    // Se estiver usando orçamento personalizado e não uma conta específica
    if (usingCustomBudget && !metaAccountId) {
      budgetAmount = customBudget?.budget_amount || budgetAmount;
    }

    console.log(`Usando orçamento personalizado: ${usingCustomBudget}`);
    console.log(`Orçamento usado: ${budgetAmount} para conta ${accountName} (${accountId})`);

    // Buscar token de acesso da Meta Ads se não foi fornecido na requisição
    let validAccessToken = accessToken;
    if (!validAccessToken) {
      const { data: tokenData } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .maybeSingle();
      
      if (!tokenData?.value) {
        console.error("Token de acesso da Meta Ads não encontrado no banco de dados");
        throw new Error("Token de acesso da Meta Ads não configurado");
      }
      
      validAccessToken = tokenData.value;
    }

    // Buscar dados reais da API do Meta Ads
    let totalSpent = 0;
    let dailyBudgetCurrent = 0;
    let apiDataFetched = false;
    
    try {
      if (accountId && validAccessToken) {
        console.log(`Buscando dados reais da API Meta Ads para conta ${accountId}`);
        
        const metaAdsData = await fetchMetaAdsData(accountId, validAccessToken);
        
        if (metaAdsData) {
          totalSpent = metaAdsData.totalSpent;
          dailyBudgetCurrent = metaAdsData.dailyBudgetCurrent;
          apiDataFetched = true;
          console.log(`Dados obtidos com sucesso da API: Gasto total = ${totalSpent}, Orçamento diário atual = ${dailyBudgetCurrent}`);
        } else {
          console.warn("Dados da API retornaram valores indefinidos");
        }
      } else {
        console.warn("ID da conta Meta ou token de acesso não disponíveis para buscar dados reais");
      }
    } catch (apiError) {
      console.error("Erro ao buscar dados da API Meta Ads:", apiError);
      // Continuar com simulação em caso de erro na API
    }
    
    // Usar simulação apenas se falhar na obtenção de dados reais
    if (!apiDataFetched) {
      console.warn("Utilizando simulação de 65% como fallback devido a erro na API");
      totalSpent = budgetAmount * 0.65; // Simulação: 65% do orçamento mensal foi gasto como fallback
      dailyBudgetCurrent = 0; // Sem valor de orçamento diário em caso de falha
    }

    // Calcular orçamento diário ideal
    const roundedIdealDailyBudget = calculateIdealDailyBudget(budgetAmount, totalSpent);
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    
    // Preparar dados para a revisão
    const reviewData = {
      meta_daily_budget_current: dailyBudgetCurrent,
      meta_total_spent: totalSpent,
      meta_account_id: accountId || null,
      client_account_id: accountId || null,
      meta_account_name: accountName,
      account_display_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
      custom_budget_start_date: usingCustomBudget ? customBudget?.start_date : null,
      custom_budget_end_date: usingCustomBudget ? customBudget?.end_date : null,
    };
    
    if (existingReview) {
      console.log("Encontrada revisão existente:", existingReview);
      
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      
      reviewId = existingReview.id;
      console.log(`Revisão existente atualizada: ${reviewId}`);
    } else {
      console.log("Criando nova revisão");
      
      // Criar nova revisão
      reviewId = await createNewReview(supabase, clientId, reviewDate, reviewData);
      console.log(`Nova revisão criada: ${reviewId}`);
    }

    // Registrar na tabela client_current_reviews para referência rápida ao estado atual
    try {
      await updateClientCurrentReview(supabase, clientId, reviewDate, reviewData);
    } catch (updateError) {
      console.error("Erro ao atualizar revisão atual:", updateError);
      // Continue mesmo com erro no update da tabela client_current_reviews
    }

    return {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      idealDailyBudget: roundedIdealDailyBudget,
      dailyBudgetCurrent,
      totalSpent,
      budgetAmount,
      usingCustomBudget,
    };
  } catch (error) {
    console.error("Erro na função Edge:", error.message);
    return {
      success: false,
      reviewId: null,
      clientId: (error as any).clientId || "",
      error: error.message
    };
  }
}

// Função de validação da requisição
function validateRequest(req: Request | string): Response | null {
  if (typeof req === 'string') {
    // Estamos validando o clientId
    if (!req) {
      return new Response(
        JSON.stringify({ error: "ID do cliente é obrigatório" }),
        { status: 400 }
      );
    }
  } else {
    // Estamos validando a requisição HTTP
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405 }
      );
    }
  }
  
  return null;
}
