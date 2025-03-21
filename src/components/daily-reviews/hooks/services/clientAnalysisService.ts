
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../useEdgeFunction";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview, ClientAnalysisResult } from "../types/reviewTypes";
import { AppError } from "@/lib/errors";
import { getActiveCustomBudget, prepareCustomBudgetInfo } from "./customBudgetService";

/**
 * Analisa um cliente específico e salva a revisão no banco de dados
 */
export const analyzeClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]): Promise<ClientAnalysisResult> => {
  // Verificar autenticação
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  const client = clientsWithReviews?.find(c => c.id === clientId);
  
  if (!client || !client.meta_account_id) {
    throw new Error("Cliente não encontrado ou sem ID de conta Meta");
  }
  
  console.log(`Analisando cliente: ${client.company_name} (${client.meta_account_id})`);
  
  const accessToken = await getMetaAccessToken();
  
  if (!accessToken) {
    throw new Error("Token de acesso Meta não disponível");
  }

  // Verificar se existe orçamento personalizado ativo
  const customBudget = await getActiveCustomBudget(clientId);
  console.log("Orçamento personalizado encontrado:", customBudget);
  
  const now = getCurrentDateInBrasiliaTz();
  
  // Definir o período de análise
  let startDate;
  if (customBudget) {
    startDate = new Date(customBudget.start_date);
    // Garantir que não buscamos dados anteriores à data de início
    if (startDate > now) {
      throw new Error("A data de início do orçamento é no futuro");
    }
  } else {
    // Caso contrário, usar o primeiro dia do mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const dateRange = {
    start: startDate.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
  
  console.log(`Período de análise: ${dateRange.start} até ${dateRange.end}`);
  
  // Chamar função Edge para obter dados do Meta Ads
  const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
    body: {
      accountId: client.meta_account_id,
      accessToken,
      dateRange: dateRange,
      fetchSeparateInsights: true
    }
  });
  
  if (error) {
    console.error("Erro na função de borda:", error);
    throw new AppError(
      `Erro ao analisar cliente: ${error.message}`, 
      "EDGE_FUNCTION_ERROR",
      { originalError: error, metaAccountId: client.meta_account_id }
    );
  }
  
  if (!data) {
    throw new Error("Resposta vazia da API");
  }
  
  console.log("Dados recebidos da API Meta:", data);
  
  return await saveClientReviewData(client, data, customBudget);
};

/**
 * Salva os dados da revisão do cliente no banco de dados
 */
async function saveClientReviewData(client: ClientWithReview, data: any, customBudget: any | null): Promise<ClientAnalysisResult> {
  const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  const metaDailyBudgetCurrent = data.totalDailyBudget || 0;
  const metaTotalSpent = data.totalSpent || 0;
  
  console.log(`Valores extraídos: orçamento diário=${metaDailyBudgetCurrent}, total gasto=${metaTotalSpent}`);
  
  if (isNaN(Number(metaDailyBudgetCurrent)) || isNaN(Number(metaTotalSpent))) {
    console.error("Valores inválidos recebidos da API:", { metaDailyBudgetCurrent, metaTotalSpent });
    throw new Error("Valores inválidos recebidos da API Meta");
  }
  
  try {
    // Preparar informações de orçamento personalizado
    const customBudgetInfo = prepareCustomBudgetInfo(customBudget);

    // Primeiro, salvar os dados na nova tabela client_current_reviews (revisões atuais)
    let currentReviewData;
    
    // Verificar se já existe uma revisão atual para este cliente
    const { data: existingReview } = await supabase
      .from('client_current_reviews')
      .select('id')
      .eq('client_id', client.id)
      .maybeSingle();

    if (existingReview) {
      console.log("Atualizando revisão atual existente para o cliente:", client.id);
      const { data: updatedReview, error: updateError } = await supabase
        .from('client_current_reviews')
        .update({
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar revisão atual:", updateError);
        throw updateError;
      }
      currentReviewData = updatedReview;
    } else {
      console.log("Criando nova revisão atual para o cliente:", client.id);
      const { data: newReview, error: insertError } = await supabase
        .from('client_current_reviews')
        .insert({
          client_id: client.id,
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Erro ao inserir revisão atual:", insertError);
        throw insertError;
      }
      currentReviewData = newReview;
    }
    
    // Para compatibilidade, também adicionar na tabela diária antiga
    // Verificar se já existe uma revisão diária para hoje
    const { data: existingDailyReview } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    if (existingDailyReview) {
      console.log("Atualizando revisão diária existente para hoje:", existingDailyReview.id);
      await supabase
        .from('daily_budget_reviews')
        .update({
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDailyReview.id);
    } else {
      console.log("Criando nova revisão diária para hoje");
      await supabase
        .from('daily_budget_reviews')
        .insert({
          client_id: client.id,
          review_date: currentDate,
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          meta_account_id: client.meta_account_id,
          meta_account_name: `Conta ${client.meta_account_id}`,
          ...customBudgetInfo
        });
    }
    
    console.log("Revisão atual e diária salvas/atualizadas com sucesso");
    
    return {
      clientId: client.id,
      reviewId: currentReviewData.id,
      analysis: {
        totalDailyBudget: metaDailyBudgetCurrent,
        totalSpent: metaTotalSpent,
        campaigns: data.campaignDetails || []
      }
    };
  } catch (dbError) {
    console.error("Erro ao executar operação no banco:", dbError);
    throw new Error(`Erro ao salvar/atualizar no banco de dados: ${dbError.message}`);
  }
}

// Exportar todas as funções necessárias
export { saveClientReviewData };
