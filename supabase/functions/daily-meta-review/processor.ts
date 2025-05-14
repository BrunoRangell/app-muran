
import { getSupabaseClient } from "./database.ts";
import { BadRequestResponse, InternalErrorResponse } from "./response.ts";
import { validateReviewRequest } from "./validators.ts";
import { fetchMetaAccountsData } from "./meta-api.ts";
import { calculateDailyBudgetSplit } from "./budget.ts";

// Recebe dados do cliente e tokens, realiza consulta à API do Facebook e salva a revisão
export async function processReviewRequest(req: Request): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    
    // Extrair e validar os dados da requisição
    const request = await req.json();
    const validationErrors = validateReviewRequest(request);
    
    if (validationErrors) {
      return BadRequestResponse(validationErrors);
    }
    
    const { clientId, accessToken, accountId } = request;
    
    // 1. Buscar cliente no banco de dados
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    
    if (clientError) {
      return BadRequestResponse(`Cliente não encontrado: ${clientError.message}`);
    }

    // 2. Buscar contas de anúncios do cliente
    const { data: metaAccounts, error: metaAccountsError } = await supabase
      .from("client_meta_accounts")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active");

    if (metaAccountsError && !accountId) {
      console.error("Erro ao buscar contas Meta do cliente:", metaAccountsError);
      // Continuar mesmo sem contas específicas (usará dados a nível de cliente)
    }

    let accountToUse = null;
    
    // Se um accountId específico foi fornecido
    if (accountId) {
      accountToUse = metaAccounts?.find(account => account.account_id === accountId);
      
      if (!accountToUse) {
        return BadRequestResponse(`Conta Meta ID ${accountId} não encontrada para o cliente`);
      }
    } 
    // Usar conta primária se existir e nenhum accountId específico foi fornecido
    else if (metaAccounts && metaAccounts.length > 0) {
      accountToUse = metaAccounts.find(account => account.is_primary) || metaAccounts[0];
    }

    // 3. Verificar se existe orçamento personalizado ativo
    const today = new Date().toISOString().split('T')[0];
    
    const { data: customBudget, error: customBudgetError } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("platform", "meta")
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
      
    if (customBudgetError) {
      console.warn("Erro ao verificar orçamento personalizado:", customBudgetError.message);
      // Continuar sem orçamento personalizado
    }
    
    let customBudgetToUse = null;
    if (customBudget) {
      // Se temos um ID de conta específico, verificar se o orçamento se aplica a essa conta
      if (accountId && customBudget.account_id && customBudget.account_id !== accountId) {
        // Este orçamento personalizado não se aplica a esta conta específica
        console.log("Orçamento personalizado existe mas é para outra conta");
      } else {
        // Orçamento personalizado se aplica (global ou específico para esta conta)
        customBudgetToUse = customBudget;
        console.log("Aplicando orçamento personalizado:", JSON.stringify(customBudgetToUse));
      }
    }

    // 4. Consultar a API do Meta/Facebook
    const metaData = await fetchMetaAccountsData(
      accountToUse?.account_id || client.meta_account_id,
      accessToken
    );
    
    if (!metaData.success) {
      return metaData.response;
    }
    
    const { adAccounts } = metaData;

    // 5. Calcular o orçamento diário e gastos
    const { totalDailyBudget, totalSpent } = calculateDailyBudgetSplit(adAccounts);
    
    if (totalDailyBudget === null || totalSpent === null) {
      return BadRequestResponse("Dados insuficientes para calcular orçamento");
    }
    
    // 6. Inserir dados de revisão no banco
    const reviewDate = new Date().toISOString().split("T")[0];

    // Preparar dados para inserir na tabela
    const payload: any = {
      client_id: clientId,
      review_date: reviewDate,
      meta_daily_budget_current: totalDailyBudget,
      meta_total_spent: totalSpent
    };
    
    // Adicionar dados da conta específica, se disponível
    if (accountToUse) {
      payload.meta_account_id = accountToUse.account_id;
      payload.meta_account_name = accountToUse.account_name;
      payload.client_account_id = accountToUse.id;
      payload.account_display_name = accountToUse.account_name;
    }
    
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
    
    // Verificar se já existe uma revisão para este cliente/data
    const { data: existingReview, error: existingError } = await supabase
      .from("daily_budget_reviews")
      .select("id")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate)
      .eq("meta_account_id", payload.meta_account_id || '')
      .maybeSingle();
    
    let result;
    
    // Se já existe, atualizar
    if (existingReview?.id) {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .update(payload)
        .eq("id", existingReview.id)
        .select();
        
      if (error) {
        return InternalErrorResponse(`Erro ao atualizar revisão: ${error.message}`);
      }
      
      result = { data: data[0], updated: true };
    } 
    // Caso contrário, inserir novo
    else {
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .insert(payload)
        .select();
        
      if (error) {
        return InternalErrorResponse(`Erro ao salvar revisão: ${error.message}`);
      }
      
      result = { data: data[0], updated: false };
    }
    
    // 7. Atualizar também a tabela de revisões atuais (client_current_reviews)
    const currentReviewPayload = {
      ...payload,
      updated_at: new Date().toISOString()
    };
    
    // Verificar se já existe um registro na tabela de revisões atuais
    const { data: existingCurrentReview, error: currentError } = await supabase
      .from("client_current_reviews")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();
      
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
    
    // 8. Retornar o resultado
    return {
      success: true,
      result: result,
      meta: {
        totalDailyBudget,
        totalSpent,
        adAccounts: adAccounts.length,
        accountId: accountToUse?.account_id || client.meta_account_id,
        accountName: accountToUse?.account_name || "Conta Principal",
        usingCustomBudget: !!customBudgetToUse,
        customBudgetInfo: customBudgetToUse || null
      }
    };
    
  } catch (error) {
    console.error("Erro no processamento da revisão:", error);
    return InternalErrorResponse(`Erro interno: ${error.message}`);
  }
}
