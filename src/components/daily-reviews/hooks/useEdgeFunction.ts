
import { supabase } from "@/lib/supabase";
import { AnalysisResult } from "./types";

/**
 * Invoca a função Edge para análise de orçamento
 */
export const invokeEdgeFunction = async (
  clientId: string,
  formattedDate: string
): Promise<AnalysisResult> => {
  console.log(`Invocando função Edge para análise de cliente ID: ${clientId}, data: ${formattedDate}`);
  
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    const isDev = import.meta.env.DEV;
    if (isDev && import.meta.env.VITE_USE_MOCK_DATA === "true") {
      throw new Error("Ambiente de desenvolvimento detectado, use simulateBudgetData em vez desta função");
    }

    const response = await supabase.functions.invoke("daily-budget-reviews", {
      body: { 
        method: "analyzeClient", 
        clientId,
        reviewDate: formattedDate 
      },
    });

    console.log("Resposta da função Edge:", response);
    
    if (response.error) {
      console.error("Erro detalhado retornado pela função Edge:", response.error);
      throw new Error(response.error.message || "Erro na análise");
    }
    
    return response.data;
  } catch (error) {
    console.error("Falha ao enviar requisição para Edge Function:", error);
    
    // Adicionar fallback para ambiente de desenvolvimento
    if (import.meta.env.DEV) {
      console.warn("Ambiente de desenvolvimento detectado, redirecionando para modo de simulação");
      throw new Error("Função Edge indisponível no ambiente de desenvolvimento. Configure VITE_USE_MOCK_DATA=true para usar dados simulados.");
    }
    
    throw new Error("Failed to send a request to the Edge Function");
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
