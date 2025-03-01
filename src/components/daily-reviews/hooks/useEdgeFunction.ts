
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "./types";

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
      .single();
    
    if (tokensError || !tokens?.value) {
      console.error("Token Meta Ads não encontrado:", tokensError);
      throw new Error("Token Meta Ads não configurado. Configure o token na página de configurações.");
    }
    
    // Chamar a função Edge passando o token e dados do cliente
    const response = await supabase.functions.invoke("daily-budget-reviews", {
      body: { 
        method: "getMetaAdsData", 
        clientId,
        reviewDate: formattedDate,
        accessToken: tokens.value
      },
    });

    console.log("Resposta da API do Meta Ads via função Edge:", response);
    
    if (response.error) {
      console.error("Erro detalhado retornado pela função Edge:", response.error);
      throw new Error(response.error.message || "Erro ao obter dados do Meta Ads");
    }
    
    return response.data;
  } catch (error) {
    console.error("Falha ao obter dados reais do Meta Ads:", error);
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
