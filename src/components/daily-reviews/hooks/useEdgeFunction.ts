
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
    
    // Chamar a função Edge passando o token e dados do cliente
    const { data, error } = await supabase.functions.invoke("daily-budget-reviews", {
      body: { 
        method: "getMetaAdsData", 
        clientId,
        reviewDate: formattedDate,
        accessToken: tokens.value
      },
    });

    console.log("Resposta recebida da função Edge:", data);
    
    if (error) {
      console.error("Erro detalhado retornado pela função Edge:", error);
      throw new Error(error.message || "Erro ao obter dados do Meta Ads");
    }
    
    if (!data) {
      console.error("Função Edge retornou dados vazios ou inválidos");
      throw new Error("A função Edge retornou dados vazios ou inválidos");
    }
    
    return data;
  } catch (error: any) {
    console.error("Falha ao obter dados do Meta Ads:", error);
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
