
import { supabase } from "@/lib/supabase";

/**
 * Chama a função Edge para análise de cliente
 */
export const callEdgeFunction = async (clientId: string) => {
  const response = await supabase.functions.invoke("daily-budget-reviews", {
    body: { method: "analyzeClient", clientId },
  });

  console.log("Resposta da função Edge:", response);
  
  if (response.error) {
    console.error("Erro retornado pela função Edge:", response.error);
    throw new Error(response.error.message || "Erro na análise");
  }
  
  return response.data;
};
