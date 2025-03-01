
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "./types";
import { AppError } from "@/lib/errors";

/**
 * Invoca a função Edge para análise de orçamento conectando-se à API da Meta Ads
 */
export const invokeEdgeFunction = async (
  clientId: string,
  formattedDate: string
): Promise<AnalysisResult> => {
  console.log(`Invocando função Edge para análise real da Meta Ads - cliente ID: ${clientId}, data: ${formattedDate}`);
  
  try {
    // Verificar se há token configurado
    const { data: tokens, error: tokensError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();
    
    if (tokensError) {
      console.error("Erro ao buscar token Meta Ads:", tokensError);
      throw new Error("Erro ao buscar token Meta Ads: " + tokensError.message);
    }
    
    if (!tokens?.value) {
      console.error("Token Meta Ads não encontrado ou está vazio");
      throw new Error("Token Meta Ads não configurado. Configure o token na página de configurações.");
    }
    
    console.log("Token Meta Ads encontrado, enviando requisição para função Edge");
    
    // Verificar se o cliente existe e buscar os dados necessários
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("company_name, meta_account_id")
      .eq("id", clientId)
      .maybeSingle();
    
    if (clientError) {
      console.error("Erro ao buscar dados do cliente:", clientError);
      // Verificar se o erro está relacionado à estrutura da tabela
      if (clientError.message && clientError.message.includes("column")) {
        throw new AppError(
          "Erro na estrutura do banco de dados. Verifique as colunas na tabela clients.",
          "DATABASE_SCHEMA_ERROR", 
          { originalError: clientError }
        );
      }
      throw new Error("Erro ao buscar dados do cliente: " + clientError.message);
    }
    
    if (!clientData) {
      console.error("Cliente não encontrado:", clientId);
      throw new Error("Cliente não encontrado.");
    }
    
    // Chamar a função Edge passando o token e dados do cliente com payload JSON bem formado
    const payload = { 
      method: "getMetaAdsData", 
      clientId,
      reviewDate: formattedDate,
      accessToken: tokens.value,
      clientName: clientData.company_name,
      metaAccountId: clientData.meta_account_id
    };
    
    console.log("Enviando payload para função Edge:", JSON.stringify(payload, null, 2));
    
    // Chamada mais robusta com timeout e tratamento de erros
    const { data, error } = await supabase.functions.invoke("daily-budget-reviews", {
      body: payload,
    });

    // Verificar erro da função Edge
    if (error) {
      console.error("Erro na função Edge:", error);
      let errorMessage = "Erro ao obter dados do Meta Ads";
      
      if (typeof error === 'object' && error !== null) {
        errorMessage = error.message || errorMessage;
        console.error("Detalhes do erro:", JSON.stringify(error, null, 2));
      }
      
      throw new AppError(errorMessage, "EDGE_FUNCTION_ERROR", { originalError: error });
    }
    
    // Verificar resposta válida
    console.log("Resposta recebida da função Edge:", data);
    
    if (!data) {
      console.error("Função Edge retornou dados vazios ou inválidos");
      throw new AppError("A função Edge retornou dados vazios ou inválidos", "INVALID_RESPONSE");
    }
    
    // Garantir que os valores numéricos estão sendo tratados corretamente
    if (data.meta_total_spent !== undefined) {
      // Certifique-se de que o valor é um número
      data.meta_total_spent = parseFloat(data.meta_total_spent);
      console.log("Valor de meta_total_spent ajustado para:", data.meta_total_spent);
    }
    
    if (data.meta_daily_budget_current !== undefined) {
      // Certifique-se de que o valor é um número
      data.meta_daily_budget_current = parseFloat(data.meta_daily_budget_current);
      console.log("Valor de meta_daily_budget_current ajustado para:", data.meta_daily_budget_current);
    }
    
    return data;
  } catch (error: any) {
    console.error("Falha ao obter dados do Meta Ads:", error);
    
    // Verificar se o erro contém alguma mensagem específica do banco de dados
    if (error.message && error.message.includes("column")) {
      console.error("Erro de coluna no banco de dados:", error.message);
      throw new AppError(
        "Erro na estrutura do banco de dados. Verifique se as colunas na tabela clients estão corretas.",
        "DATABASE_SCHEMA_ERROR", 
        { originalError: error }
      );
    }
    
    // Detalhando o erro para facilitar diagnóstico
    if (error instanceof Error) {
      console.error("Tipo de erro:", error.name);
      console.error("Mensagem de erro:", error.message);
      console.error("Stack trace:", error.stack);
    } else {
      console.error("Erro não padrão:", JSON.stringify(error, null, 2));
    }
    
    throw error;
  }
};

/**
 * Chama a função Edge para análise de cliente (nome alternativo para compatibilidade)
 */
export const callEdgeFunction = async (clientId: string) => {
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().split('T')[0];
  return await invokeEdgeFunction(clientId, formattedDate);
};
