
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
    
    // Validação básica de payload
    if (!payload) {
      console.error("[edgeFunctionService] Payload inválido (nulo ou indefinido)");
      throw new Error("Payload inválido para função Edge (nulo ou indefinido)");
    }
    
    if (typeof payload !== 'object') {
      console.error("[edgeFunctionService] Payload deve ser um objeto:", typeof payload);
      throw new Error(`Payload inválido para função Edge (tipo: ${typeof payload})`);
    }
    
    // Fazer cópia profunda para evitar problemas com referências
    let safePayload;
    try {
      // Abordagem que evita problemas com referências cíclicas
      safePayload = JSON.parse(JSON.stringify(payload));
    } catch (err) {
      console.error("[edgeFunctionService] Erro ao serializar payload:", err);
      throw new Error(`Não foi possível serializar o payload: ${err.message}`);
    }
    
    // Verificação final de payload vazio
    if (!safePayload || Object.keys(safePayload).length === 0) {
      console.error("[edgeFunctionService] Payload vazio após processamento");
      throw new Error("Payload vazio após processamento");
    }
    
    // Log sanitizado (sem dados sensíveis)
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
    
    // Usar Supabase para invocar a função Edge
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
    
    // Obter sessão para autenticação
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error("Sessão não encontrada. Por favor, faça login novamente");
    }
    
    // Validação do payload de teste
    if (!testPayload || typeof testPayload !== 'object') {
      throw new Error("Payload de teste inválido");
    }
    
    // Serialização segura
    let safePayload;
    try {
      safePayload = JSON.parse(JSON.stringify(testPayload));
    } catch (err) {
      throw new Error(`Erro ao serializar payload de teste: ${err.message}`);
    }
    
    // Usando fetch direto para evitar problemas no cliente Supabase
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-budget-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(safePayload)
    });
    
    let data;
    let errorText;
    
    try {
      data = await response.json();
    } catch (err) {
      errorText = await response.text();
      console.error("[testEdgeConnectivity] Erro ao parsear resposta JSON:", errorText);
    }
    
    const error = !response.ok ? { 
      message: `HTTP error ${response.status}: ${errorText || "Sem detalhes"}` 
    } : null;
    
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
