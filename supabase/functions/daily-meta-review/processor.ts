
import { 
  createSupabaseClient,
  fetchClientData, 
  fetchMetaAccountDetails, 
  fetchActiveCustomBudget,
  checkExistingReview,
  updateExistingReview,
  createNewReview,
  updateClientCurrentReview,
  fetchMetaAdsData
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
  apiDiagnostics?: any;
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

    console.log(`DIAGNÓSTICO REVISÃO: Iniciando revisão META para cliente ${clientId} com conta Meta ${metaAccountId || "padrão"}`);

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
    console.log(`DIAGNÓSTICO REVISÃO: Cliente encontrado: ${client.company_name}`);

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

    console.log(`DIAGNÓSTICO REVISÃO: Conta configurada - ID: ${accountId}, Nome: ${accountName}, Orçamento: ${budgetAmount}`);

    // Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split("T")[0];
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);

    const usingCustomBudget = !!customBudget;
    
    // Se estiver usando orçamento personalizado e não uma conta específica
    if (usingCustomBudget && !metaAccountId) {
      budgetAmount = customBudget?.budget_amount || budgetAmount;
    }

    console.log(`DIAGNÓSTICO REVISÃO: Usando orçamento personalizado: ${usingCustomBudget}`);
    console.log(`DIAGNÓSTICO REVISÃO: Orçamento final usado: ${budgetAmount}`);

    // TENTATIVA DE BUSCAR DADOS REAIS DA API META ADS
    let totalSpent = 0;
    let currentDailyBudget = 0;
    let apiDiagnostics: any = {};

    // Se não temos dados reais enviados na requisição, tentar buscar da API
    if (!realApiData && accountId) {
      try {
        console.log(`DIAGNÓSTICO REVISÃO: Tentando buscar dados reais da API Meta para conta ${accountId}`);
        
        // Buscar token de acesso
        const { data: tokenData, error: tokenError } = await supabase
          .from("api_tokens")
          .select("value")
          .eq("name", "meta_access_token")
          .maybeSingle();

        if (tokenError || !tokenData?.value) {
          console.log(`DIAGNÓSTICO REVISÃO: Token Meta não encontrado ou erro: ${tokenError?.message || 'Token vazio'}`);
          apiDiagnostics.tokenError = tokenError?.message || 'Token não configurado';
        } else {
          console.log(`DIAGNÓSTICO REVISÃO: Token Meta encontrado, tentando buscar dados da API`);
          
          // Definir período para busca (mês atual)
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const dateRange = {
            start: startOfMonth.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0]
          };
          
          try {
            const apiData = await fetchMetaAdsData(tokenData.value, accountId, dateRange);
            totalSpent = apiData.totalSpent || 0;
            currentDailyBudget = apiData.dailyBudget || 0;
            
            console.log(`DIAGNÓSTICO REVISÃO: Dados REAIS obtidos da API Meta - Gasto: ${totalSpent}, Orçamento Diário: ${currentDailyBudget}`);
            apiDiagnostics.success = true;
            apiDiagnostics.dataSource = 'meta_api';
          } catch (apiError: any) {
            console.error(`DIAGNÓSTICO REVISÃO: Erro ao buscar dados da API Meta:`, apiError);
            apiDiagnostics.apiError = apiError.message;
            apiDiagnostics.dataSource = 'fallback_zero';
            // Manter valores zerados
          }
        }
      } catch (generalError: any) {
        console.error(`DIAGNÓSTICO REVISÃO: Erro geral ao tentar buscar dados da API:`, generalError);
        apiDiagnostics.generalError = generalError.message;
        apiDiagnostics.dataSource = 'fallback_zero';
      }
    } else if (realApiData) {
      console.log(`DIAGNÓSTICO REVISÃO: Usando dados REAIS enviados na requisição:`, realApiData);
      totalSpent = realApiData.totalSpent || 0;
      currentDailyBudget = realApiData.dailyBudget || 0;
      apiDiagnostics.dataSource = 'request_data';
    } else {
      console.log(`DIAGNÓSTICO REVISÃO: Nenhuma conta Meta configurada, usando valores zerados`);
      apiDiagnostics.dataSource = 'no_account';
    }

    // Calcular orçamento diário ideal baseado nos dados reais ou zerados
    const roundedIdealDailyBudget = calculateIdealDailyBudget(budgetAmount, totalSpent);
    
    // Verificar se já existe uma revisão atual para este cliente e conta específica
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    
    // Preparar dados para a revisão - APENAS DADOS REAIS OU ZERADOS
    const reviewData = {
      meta_daily_budget_current: currentDailyBudget,
      meta_total_spent: totalSpent,
      meta_account_id: accountId || null,
      client_account_id: accountId || null,
      meta_account_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: usingCustomBudget ? customBudget?.budget_amount : null,
      custom_budget_start_date: usingCustomBudget ? customBudget?.start_date : null,
      custom_budget_end_date: usingCustomBudget ? customBudget?.end_date : null
    };
    
    console.log("DIAGNÓSTICO REVISÃO: Dados FINAIS para salvar (apenas valores reais ou zerados):", {
      orçamentoDiárioAtual: currentDailyBudget,
      gastoTotal: totalSpent,
      orçamentoDiárioIdeal: roundedIdealDailyBudget,
      usandoOrçamentoPersonalizado: usingCustomBudget,
      fonteDados: apiDiagnostics.dataSource
    });
    
    if (existingReview) {
      console.log("DIAGNÓSTICO REVISÃO: Encontrada revisão existente, atualizando...");
      
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      
      reviewId = existingReview.id;
      console.log(`DIAGNÓSTICO REVISÃO: Revisão existente atualizada com dados reais: ${reviewId}`);
    } else {
      console.log("DIAGNÓSTICO REVISÃO: Criando nova revisão...");
      
      // Criar nova revisão
      reviewId = await createNewReview(supabase, clientId, reviewDate, reviewData);
      console.log(`DIAGNÓSTICO REVISÃO: Nova revisão criada com dados reais: ${reviewId}`);
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
      apiDiagnostics
    };
  } catch (error) {
    console.error("DIAGNÓSTICO REVISÃO: Erro na função Edge META:", error.message);
    return {
      success: false,
      reviewId: null,
      clientId: (error as any).clientId || "",
      error: error.message,
      apiDiagnostics: { error: error.message }
    };
  }
}
