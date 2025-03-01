
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
  
  const response = await supabase.functions.invoke("daily-budget-reviews", {
    body: { 
      method: "analyzeClient", 
      clientId,
      reviewDate: formattedDate 
    },
  });

  console.log("Resposta da função Edge:", response);
  
  if (response.error) {
    console.error("Erro retornado pela função Edge:", response.error);
    throw new Error(response.error.message || "Erro na análise");
  }
  
  return response.data;
};

/**
 * Chama a função Edge para análise de cliente (nome alternativo para compatibilidade)
 */
export const callEdgeFunction = async (clientId: string) => {
  const todayDate = new Date();
  const formattedDate = todayDate.toISOString().split('T')[0];
  return await invokeEdgeFunction(clientId, formattedDate);
};
