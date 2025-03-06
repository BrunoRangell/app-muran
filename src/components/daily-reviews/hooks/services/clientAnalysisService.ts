
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../useEdgeFunction";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";
import { ClientWithReview, ClientAnalysisResult } from "../types/reviewTypes";

/**
 * Analisa um cliente específico e salva a revisão no banco de dados
 */
export const analyzeClient = async (clientId: string, clientsWithReviews?: ClientWithReview[]): Promise<ClientAnalysisResult> => {
  const client = clientsWithReviews?.find(c => c.id === clientId);
  
  if (!client || !client.meta_account_id) {
    throw new Error("Cliente não encontrado ou sem ID de conta Meta");
  }
  
  console.log(`Analisando cliente: ${client.company_name} (${client.meta_account_id})`);
  
  // Obter token de acesso
  const accessToken = await getMetaAccessToken();
  
  if (!accessToken) {
    throw new Error("Token de acesso Meta não disponível");
  }
  
  // Chamar função de borda para calcular orçamento
  const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
    body: {
      accountId: client.meta_account_id,
      accessToken
    }
  });
  
  if (error) {
    console.error("Erro na função de borda:", error);
    throw new Error(`Erro ao analisar cliente: ${error.message}`);
  }
  
  if (!data) {
    throw new Error("Resposta vazia da API");
  }
  
  console.log("Dados recebidos da API:", data);
  
  // Obter a data atual no fuso horário de Brasília
  const currentDate = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  
  // Salvar os resultados no banco de dados como uma nova revisão diária
  const { data: reviewData, error: reviewError } = await supabase.rpc(
    "insert_daily_budget_review",
    {
      p_client_id: client.id,
      p_review_date: currentDate,
      p_meta_daily_budget_current: data.totalDailyBudget,
      p_meta_total_spent: data.totalSpent || 0,
      p_meta_account_id: client.meta_account_id,
      p_meta_account_name: `Conta ${client.meta_account_id}`
    }
  );
  
  if (reviewError) {
    console.error("Erro ao salvar revisão:", reviewError);
    throw new Error(`Erro ao salvar revisão: ${reviewError.message}`);
  }
  
  console.log("Revisão salva com sucesso:", reviewData);
  
  return {
    clientId,
    reviewId: reviewData,
    analysis: data
  };
};

/**
 * Analisa todos os clientes elegíveis em sequência
 */
export const analyzeAllClients = async (
  clientsWithReviews: ClientWithReview[] | undefined,
  onClientProcessingStart: (clientId: string) => void,
  onClientProcessingEnd: (clientId: string) => void
) => {
  const results: ClientAnalysisResult[] = [];
  const errors: { clientId: string; clientName: string; error: string }[] = [];
  
  // Filtrar apenas clientes com ID de conta Meta configurado
  const eligibleClients = clientsWithReviews?.filter(client => 
    client.meta_account_id && client.meta_account_id.trim() !== ""
  ) || [];
  
  console.log(`Iniciando revisão em massa para ${eligibleClients.length} clientes`);
  
  // Processar clientes em sequência para evitar sobrecarga
  for (const client of eligibleClients) {
    try {
      onClientProcessingStart(client.id);
      const result = await analyzeClient(client.id, clientsWithReviews);
      results.push(result);
    } catch (error) {
      console.error(`Erro ao analisar cliente ${client.company_name}:`, error);
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
