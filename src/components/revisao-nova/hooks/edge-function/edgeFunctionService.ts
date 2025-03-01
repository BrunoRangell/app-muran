
import { supabase } from "@/lib/supabase";

/**
 * Serviço para invocar funções Edge do Supabase
 */

/**
 * Chama a função Edge sem transformação adicional
 */
export const invokeEdgeFunction = async (payload: any) => {
  try {
    console.log("[edgeFunctionService] Tentando invocar função Edge...");
    
    // Simplificar: não usar transformações complicadas
    // Apenas verificar se o payload é válido e copiar direto
    if (!payload || typeof payload !== 'object') {
      throw new Error("Payload inválido para função Edge");
    }
    
    // Copiar payload diretamente sem processamento adicional
    const safePayload = { ...payload };
    
    // Log simplificado (sem dados sensíveis)
    const sanitizedPayload = { ...safePayload };
    if (sanitizedPayload.accessToken) {
      sanitizedPayload.accessToken = "***TOKEN OCULTADO***";
    }
    
    console.log("[edgeFunctionService] Enviando payload:", 
              JSON.stringify(sanitizedPayload));
    
    console.log("[edgeFunctionService] Tamanho do payload:", 
              JSON.stringify(safePayload).length, "bytes");
    
    // Adicionar timeout para evitar problemas de conexão pendente
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout ao esperar resposta da função Edge (15s)")), 15000);
    });
    
    // IMPORTANTE: Não realizar nenhuma transformação adicional no payload
    // Deixar o Supabase lidar com a serialização
    const functionPromise = supabase.functions.invoke(
      "daily-budget-reviews", 
      { 
        body: safePayload
      }
    );
    
    // Corrida entre a função e o timeout
    const { data: result, error: functionError } = await Promise.race([
      functionPromise,
      timeoutPromise
    ]) as any;
    
    console.log("[edgeFunctionService] Resposta da função Edge:", result);
    
    if (functionError) {
      console.error("[edgeFunctionService] Erro na função Edge:", functionError);
      throw new Error(`Erro na função Edge: ${functionError.message || "Erro desconhecido"}`);
    }
    
    if (!result) {
      console.error("[edgeFunctionService] Resultado vazio da função Edge");
      throw new Error("A função retornou dados vazios ou inválidos");
    }
    
    return { result };
  } catch (err) {
    console.error("[edgeFunctionService] Erro ao chamar função Edge:", err);
    return { error: err };
  }
};

/**
 * Testa a conectividade com a função Edge usando fetch direto
 */
export const testEdgeConnectivity = async (testPayload: any) => {
  try {
    console.log("[testEdgeConnectivity] Testando conectividade via fetch direto...");
    
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error("Sessão não encontrada. Por favor, faça login novamente");
    }
    
    // Usando abordagem com fetch direto para evitar problemas no cliente Supabase
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-budget-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    const error = !response.ok ? { message: `HTTP error ${response.status}` } : null;
    
    return {
      success: !error,
      data,
      error,
      statusCode: response.status
    };
  } catch (err) {
    console.error("[testEdgeConnectivity] Erro ao testar conectividade:", err);
    return {
      success: false,
      error: err,
      data: null,
      statusCode: 0
    };
  }
};
