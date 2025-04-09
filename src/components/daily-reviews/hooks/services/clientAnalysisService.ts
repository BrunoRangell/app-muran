
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
    // Verificar se já existe uma revisão para hoje
    const { data: existingReview } = await supabase
      .from('daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    let reviewData;
    
    // Preparar informações de orçamento personalizado
    const customBudgetInfo = prepareCustomBudgetInfo(customBudget);

    if (existingReview) {
      console.log("Atualizando revisão existente para hoje:", existingReview.id);
      const { data: updatedReview, error: updateError } = await supabase
        .from('daily_budget_reviews')
        .update({
          meta_daily_budget_current: metaDailyBudgetCurrent,
          meta_total_spent: metaTotalSpent,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar revisão:", updateError);
        throw updateError;
      }
      reviewData = updatedReview;
    } else {
      // Verificar se já existem revisões antigas para este cliente e data
      // Se existirem, apagar todas elas antes de inserir a nova
      await cleanOldReviews(client.id, currentDate);
      
      console.log("Criando nova revisão para hoje");
      const { data: newReview, error: insertError } = await supabase
        .from('daily_budget_reviews')
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
        console.error("Erro ao inserir revisão:", insertError);
        throw insertError;
      }
      reviewData = newReview;
    }
    
    console.log("Revisão salva/atualizada com sucesso:", reviewData);
    
    return {
      clientId: client.id,
      reviewId: reviewData.id,
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

/**
 * Limpa revisões antigas para um cliente e data específicos
 * Mantém apenas a mais recente para a data especificada
 */
async function cleanOldReviews(clientId: string, reviewDate: string) {
  // Verificar se já existem revisões antigas para a mesma data
  const { data: existingReviews, error } = await supabase
    .from('daily_budget_reviews')
    .select('id, created_at')
    .eq('client_id', clientId)
    .eq('review_date', reviewDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao verificar revisões existentes:", error);
    return; // Continuar mesmo com erro
  }

  // Se existirem mais de uma revisão para a mesma data, manter apenas a mais recente
  if (existingReviews && existingReviews.length > 0) {
    // Pular a primeira (mais recente) e excluir as demais
    const reviewsToDelete = existingReviews.slice(1).map(review => review.id);
    
    if (reviewsToDelete.length > 0) {
      console.log(`Removendo ${reviewsToDelete.length} revisões antigas para o cliente ${clientId}`);
      
      const { error: deleteError } = await supabase
        .from('daily_budget_reviews')
        .delete()
        .in('id', reviewsToDelete);
      
      if (deleteError) {
        console.error("Erro ao remover revisões antigas:", deleteError);
      }
    }
  }
}
