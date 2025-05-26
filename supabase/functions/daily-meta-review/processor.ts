
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
    lastFiveDaysSpent: number;
  };
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
      realApiData
    } = requestBody;

    console.log(`Iniciando revisão META para cliente ${clientId} com conta Meta ${metaAccountId || "padrão"}`);

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

    console.log(`Usando orçamento personalizado: ${usingCustomBudget}`);
    console.log(`Orçamento usado: ${budgetAmount} para conta ${accountName} (${accountId})`);

    // NOVA LÓGICA: APENAS DADOS REAIS OU ZERADOS
    let totalSpent = 0;
    let currentDailyBudget = 0;
    let lastFiveDaysSpent = 0;

    // Se temos dados reais da API Meta, usar eles
    if (realApiData) {
      console.log("Usando dados REAIS da API Meta:", realApiData);
      totalSpent = realApiData.totalSpent || 0;
      currentDailyBudget = realApiData.dailyBudget || 0;
      lastFiveDaysSpent = realApiData.lastFiveDaysSpent || 0;
    } else {
      console.log("Nenhum dado real da API Meta disponível - usando valores zerados");
      // Valores já estão zerados por padrão
      totalSpent = 0;
      currentDailyBudget = 0;
      lastFiveDaysSpent = 0;
    }

    // Calcular orçamento diário ideal baseado nos dados reais ou zerados
    const roundedIdealDailyBudget = calculateIdealDailyBudget(budgetAmount, totalSpent);
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    
    // Preparar dados para a revisão - APENAS DADOS REAIS OU ZERADOS
    const reviewData = {
      meta_daily_budget_current: currentDailyBudget, // Dados reais ou zerado
      meta_total_spent: totalSpent, // Dados reais ou zerado
      meta_last_five_days_spent: lastFiveDaysSpent, // Dados reais ou zerado
      meta_account_id: accountId || null,
      client_account_id: accountId || null,
      meta_account_name: accountName,
      account_display_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
      custom_budget_start_date: usingCustomBudget ? customBudget?.start_date : null,
      custom_budget_end_date: usingCustomBudget ? customBudget?.end_date : null
    };
    
    console.log("Dados FINAIS para revisão META (apenas valores reais ou zerados):", {
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      gastoMédiaCincoDias: lastFiveDaysSpent,
      orçamentoDiárioIdeal: roundedIdealDailyBudget,
      usandoOrçamentoPersonalizado: usingCustomBudget
    });
    
    if (existingReview) {
      console.log("Encontrada revisão existente:", existingReview);
      
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      
      reviewId = existingReview.id;
      console.log(`Revisão existente atualizada com dados reais: ${reviewId}`);
    } else {
      console.log("Criando nova revisão");
      
      // Criar nova revisão
      reviewId = await createNewReview(supabase, clientId, reviewDate, reviewData);
      console.log(`Nova revisão criada com dados reais: ${reviewId}`);
    }

    // Registrar na tabela client_current_reviews para referência rápida ao estado atual
    await updateClientCurrentReview(supabase, clientId, reviewDate, reviewData);

    return {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      idealDailyBudget: roundedIdealDailyBudget,
      totalSpent,
      budgetAmount,
      usingCustomBudget,
    };
  } catch (error) {
    console.error("Erro na função Edge META:", error.message);
    return {
      success: false,
      reviewId: null,
      clientId: (error as any).clientId || "",
      error: error.message
    };
  }
}
