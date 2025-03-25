
import { supabase } from "@/lib/supabase";
import { ClientWithReview, ClientAnalysisResult, BatchReviewResult } from "../types/reviewTypes";
import { AppError } from "@/lib/errors";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { getActiveCustomBudget, prepareCustomBudgetInfo } from "./customBudgetService";

/**
 * Busca todos os clientes com suas respectivas revisões mais recentes de Google Ads
 */
export const fetchGoogleAdsClientsWithReviews = async () => {
  console.log("Iniciando fetchGoogleAdsClientsWithReviews");
  // Verificar autenticação antes de fazer a requisição
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  // Primeiro, buscar todos os clientes ativos
  const { data: clientsData, error } = await supabase
    .from('clients')
    .select(`
      id,
      company_name,
      google_account_id,
      google_ads_budget,
      meta_account_id
    `)
    .eq('status', 'active')
    .order('company_name');
    
  if (error) {
    console.error("Erro ao buscar clientes para Google Ads:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  
  // Agora, para cada cliente, buscar apenas a revisão mais recente
  let lastReviewTime: Date | null = null;
  const processedClients = [];
  
  for (const client of clientsData || []) {
    // Buscar apenas a revisão mais recente para este cliente
    const { data: reviewData, error: reviewError } = await supabase
      .from('google_ads_daily_budget_reviews')
      .select('*')
      .eq('client_id', client.id)
      .order('review_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (reviewError) {
      console.error(`Erro ao buscar revisão Google Ads para cliente ${client.company_name}:`, reviewError);
      // Continuar com o próximo cliente
      processedClients.push({
        ...client,
        lastReview: null
      });
      continue;
    }
    
    // Adicionar a revisão mais recente ao cliente
    processedClients.push({
      ...client,
      lastReview: reviewData
    });
    
    // Atualizar o timestamp da revisão mais recente global
    if (reviewData) {
      const reviewDate = new Date(reviewData.created_at);
      if (!lastReviewTime || reviewDate > lastReviewTime) {
        lastReviewTime = reviewDate;
      }
    }
  }
  
  console.log("Clientes processados com revisões Google Ads:", processedClients?.length);
  
  return { 
    clientsData: processedClients as ClientWithReview[] || [],
    lastReviewTime 
  };
};

/**
 * Analisa um cliente específico para Google Ads e salva a revisão no banco de dados
 */
export const analyzeGoogleAdsClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]): Promise<ClientAnalysisResult> => {
  // Verificar autenticação
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    console.error("Sessão não encontrada");
    throw new Error("Usuário não autenticado");
  }

  const client = clientsWithReviews?.find(c => c.id === clientId);
  
  if (!client || !client.google_account_id) {
    throw new Error("Cliente não encontrado ou sem ID de conta Google Ads");
  }
  
  console.log(`Analisando cliente para Google Ads: ${client.company_name} (${client.google_account_id})`);
  
  // IMPORTANTE: Como ainda não temos a API do Google Ads configurada,
  // vamos simular os dados para demonstração.
  // Isso será substituído posteriormente pela API real.
  
  // Verificar se existe orçamento personalizado ativo
  const customBudget = await getActiveCustomBudget(clientId);
  console.log("Orçamento personalizado encontrado:", customBudget);
  
  const now = getCurrentDateInBrasiliaTz();
  
  // Simular alguns dados para demonstração
  const totalDailyBudget = client.google_ads_budget ? client.google_ads_budget / 30 : 0;
  const totalSpent = Math.random() * client.google_ads_budget * 0.7; // Vamos simular gasto entre 0 e 70% do orçamento
  
  const simulatedData = {
    totalDailyBudget: parseFloat(totalDailyBudget.toFixed(2)),
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    campaigns: []
  };
  
  // Salvar a revisão no banco de dados
  return await saveGoogleAdsClientReviewData(client, simulatedData, customBudget);
};

/**
 * Analisa todos os clientes elegíveis em sequência para Google Ads
 */
export const analyzeAllGoogleAdsClients = async (
  clientsWithReviews: ClientWithReview[] | undefined,
  onClientProcessingStart: (clientId: string) => void,
  onClientProcessingEnd: (clientId: string) => void
): Promise<BatchReviewResult> => {
  const results: ClientAnalysisResult[] = [];
  const errors: { clientId: string; clientName: string; error: string }[] = [];
  
  // Filtrar apenas clientes com ID de conta Google Ads configurado
  const eligibleClients = clientsWithReviews?.filter(client => 
    client.google_account_id && client.google_account_id.trim() !== ""
  ) || [];
  
  console.log(`Iniciando revisão em massa para ${eligibleClients.length} clientes (Google Ads)`);
  
  // Processar clientes em sequência para evitar sobrecarga
  for (const client of eligibleClients) {
    try {
      onClientProcessingStart(client.id);
      const result = await analyzeGoogleAdsClient(client.id, clientsWithReviews);
      results.push(result);
    } catch (error) {
      console.error(`Erro ao analisar cliente Google Ads ${client.company_name}:`, error);
      errors.push({
        clientId: client.id,
        clientName: client.company_name,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      onClientProcessingEnd(client.id);
    }
  }
  
  return { results, errors };
};

/**
 * Salva os dados da revisão do cliente no banco de dados para Google Ads
 */
async function saveGoogleAdsClientReviewData(client: ClientWithReview, data: any, customBudget: any | null): Promise<ClientAnalysisResult> {
  const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  const googleAdsDailyBudgetCurrent = data.totalDailyBudget || 0;
  const googleAdsTotalSpent = data.totalSpent || 0;
  
  console.log(`Valores extraídos Google Ads: orçamento diário=${googleAdsDailyBudgetCurrent}, total gasto=${googleAdsTotalSpent}`);
  
  if (isNaN(Number(googleAdsDailyBudgetCurrent)) || isNaN(Number(googleAdsTotalSpent))) {
    console.error("Valores inválidos para Google Ads:", { googleAdsDailyBudgetCurrent, googleAdsTotalSpent });
    throw new Error("Valores inválidos para Google Ads");
  }
  
  try {
    // Verificar se já existe uma revisão para hoje
    const { data: existingReview } = await supabase
      .from('google_ads_daily_budget_reviews')
      .select('id')
      .eq('client_id', client.id)
      .eq('review_date', currentDate)
      .maybeSingle();

    let reviewData;
    
    // Preparar informações de orçamento personalizado
    const customBudgetInfo = prepareCustomBudgetInfo(customBudget);

    if (existingReview) {
      console.log("Atualizando revisão Google Ads existente para hoje:", existingReview.id);
      const { data: updatedReview, error: updateError } = await supabase
        .from('google_ads_daily_budget_reviews')
        .update({
          google_ads_daily_budget_current: googleAdsDailyBudgetCurrent,
          google_ads_total_spent: googleAdsTotalSpent,
          ...customBudgetInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Erro ao atualizar revisão Google Ads:", updateError);
        throw updateError;
      }
      reviewData = updatedReview;
    } else {
      // Verificar se já existem revisões antigas para este cliente e data
      // Se existirem, apagar todas elas antes de inserir a nova
      await cleanOldGoogleAdsReviews(client.id, currentDate);
      
      console.log("Criando nova revisão Google Ads para hoje");
      const { data: newReview, error: insertError } = await supabase
        .from('google_ads_daily_budget_reviews')
        .insert({
          client_id: client.id,
          review_date: currentDate,
          google_ads_daily_budget_current: googleAdsDailyBudgetCurrent,
          google_ads_total_spent: googleAdsTotalSpent,
          google_account_id: client.google_account_id,
          google_account_name: `Conta ${client.google_account_id}`,
          ...customBudgetInfo
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Erro ao inserir revisão Google Ads:", insertError);
        throw insertError;
      }
      reviewData = newReview;
    }
    
    console.log("Revisão Google Ads salva/atualizada com sucesso:", reviewData);
    
    return {
      clientId: client.id,
      reviewId: reviewData.id,
      analysis: {
        totalDailyBudget: googleAdsDailyBudgetCurrent,
        totalSpent: googleAdsTotalSpent,
        campaigns: data.campaigns || []
      }
    };
  } catch (dbError) {
    console.error("Erro ao executar operação no banco para Google Ads:", dbError);
    throw new Error(`Erro ao salvar/atualizar no banco de dados Google Ads: ${dbError.message}`);
  }
}

/**
 * Limpa revisões antigas do Google Ads para um cliente e data específicos
 * Mantém apenas a mais recente para a data especificada
 */
async function cleanOldGoogleAdsReviews(clientId: string, reviewDate: string) {
  // Verificar se já existem revisões antigas para a mesma data
  const { data: existingReviews, error } = await supabase
    .from('google_ads_daily_budget_reviews')
    .select('id, created_at')
    .eq('client_id', clientId)
    .eq('review_date', reviewDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao verificar revisões Google Ads existentes:", error);
    return; // Continuar mesmo com erro
  }

  // Se existirem mais de uma revisão para a mesma data, manter apenas a mais recente
  if (existingReviews && existingReviews.length > 0) {
    // Pular a primeira (mais recente) e excluir as demais
    const reviewsToDelete = existingReviews.slice(1).map(review => review.id);
    
    if (reviewsToDelete.length > 0) {
      console.log(`Removendo ${reviewsToDelete.length} revisões Google Ads antigas para o cliente ${clientId}`);
      
      const { error: deleteError } = await supabase
        .from('google_ads_daily_budget_reviews')
        .delete()
        .in('id', reviewsToDelete);
      
      if (deleteError) {
        console.error("Erro ao remover revisões Google Ads antigas:", deleteError);
      }
    }
  }
}
