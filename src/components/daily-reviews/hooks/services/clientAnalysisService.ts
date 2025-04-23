
import { supabase } from "@/lib/supabase";
import { supabaseEdgeFunctionUrl } from "../useEdgeFunction";

/**
 * Realiza a análise de orçamento de um cliente específico
 */
export const reviewClient = async (clientId: string, accountId?: string) => {
  try {
    console.log(`[clientAnalysisService] Iniciando revisão para cliente: ${clientId}${accountId ? ` com conta ${accountId}` : ''}`);
    
    // Verificar se o cliente existe
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
      
    if (clientError) {
      console.error("[clientAnalysisService] Erro ao buscar cliente:", clientError);
      throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
    }
    
    if (!client) {
      console.error("[clientAnalysisService] Cliente não encontrado:", clientId);
      throw new Error("Cliente não encontrado");
    }
    
    // Se foi especificado um accountId, buscar detalhes da conta Meta
    let metaAccount = null;
    if (accountId) {
      const { data: accountData, error: accountError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("client_id", clientId)
        .eq("account_id", accountId)
        .maybeSingle();
        
      if (accountError) {
        console.error("[clientAnalysisService] Erro ao buscar conta Meta:", accountError);
      } else if (accountData) {
        metaAccount = accountData;
        console.log("[clientAnalysisService] Conta Meta encontrada:", metaAccount);
      }
    }
    
    // Configurar o payload para a função Edge
    const payload = {
      clientId: client.id,
      metaAccountId: accountId || client.meta_account_id,
      reviewDate: new Date().toISOString().split('T')[0]
    };
    
    // Se tiver detalhes da conta Meta, incluir no payload
    if (metaAccount) {
      payload.metaAccountName = metaAccount.account_name;
      payload.metaBudgetAmount = metaAccount.budget_amount;
    }
    
    console.log("[clientAnalysisService] Enviando payload para função Edge:", payload);
    
    // Chamar a função Edge
    const { data: response, error: edgeFunctionError } = await supabase.functions.invoke(
      "daily-meta-review",
      {
        body: payload
      }
    );
    
    if (edgeFunctionError) {
      console.error("[clientAnalysisService] Erro na função Edge:", edgeFunctionError);
      throw new Error(`Erro ao processar revisão: ${edgeFunctionError.message}`);
    }
    
    if (!response || response.error) {
      const errorMessage = response?.error || "Resposta inválida da função Edge";
      console.error("[clientAnalysisService] Erro na resposta da função Edge:", errorMessage);
      throw new Error(`Erro ao processar revisão: ${errorMessage}`);
    }
    
    console.log("[clientAnalysisService] Revisão concluída com sucesso:", response);
    
    return response;
  } catch (error: any) {
    console.error("[clientAnalysisService] Erro na revisão do cliente:", error);
    throw error;
  }
};
