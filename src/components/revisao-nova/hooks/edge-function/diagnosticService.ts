
import { useToast } from "@/hooks/use-toast";
import { testEdgeConnectivity } from "./edgeFunctionService";

/**
 * Analisa o tipo de erro e gera informações de diagnóstico
 */
export const analyzeEdgeError = (error: any) => {
  let errorType = "UNKNOWN";
  let suggestion = "";
  
  // Garantir que temos uma string de erro para analisar
  const errorMessage = error?.message || String(error || "");
  
  if (errorMessage.includes("Failed to send") || errorMessage.includes("fetch")) {
    errorType = "NETWORK_ERROR";
    suggestion = "Verifique se a função Edge está publicada e se o Supabase está online.";
  } else if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    errorType = "TIMEOUT_ERROR";
    suggestion = "A função Edge demorou muito para responder. Pode ser um problema de conexão ou sobrecarga.";
  } else if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
    errorType = "CORS_ERROR";
    suggestion = "Problema de CORS. Verifique se a função Edge tem as configurações corretas de CORS.";
  } else if (errorMessage.includes("Corpo da requisição vazio") || errorMessage.includes("empty") || errorMessage.includes("body")) {
    errorType = "EMPTY_BODY_ERROR";
    suggestion = "O corpo da requisição está vazio. Verifique a serialização do payload e o content-type.";
  }
  
  return {
    errorType,
    originalError: errorMessage,
    suggestion,
    possibleFixes: [
      "Verificar se a função 'daily-budget-reviews' está publicada no Supabase",
      "Verificar se há regras de CORS configuradas na função",
      "Tentar republicar a função Edge",
      "Verificar as configurações de permissão da função no Supabase"
    ]
  };
};

/**
 * Fornece informações detalhadas sobre um payload para debugging
 */
export const inspectPayload = (payload: any) => {
  try {
    return {
      payloadType: typeof payload,
      isNull: payload === null,
      isUndefined: payload === undefined,
      isEmpty: payload ? Object.keys(payload || {}).length === 0 : true,
      stringifiedLength: payload ? JSON.stringify(payload || {}).length : 0,
      hasCyclicReferences: detectCyclicReferences(payload),
      rawPayload: payload
    };
  } catch (err) {
    return {
      payloadType: typeof payload,
      isNull: payload === null,
      isUndefined: payload === undefined,
      error: `Erro ao inspecionar payload: ${err?.message || String(err)}`,
      rawValue: String(payload)
    };
  }
};

/**
 * Detecta referências cíclicas em objetos que podem causar problemas de serialização
 */
const detectCyclicReferences = (obj: any, seen = new WeakSet()): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  if (seen.has(obj)) return true;
  seen.add(obj);
  
  // Verificar arrays
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object' && detectCyclicReferences(item, seen)) {
        return true;
      }
    }
    return false;
  }
  
  // Verificar objetos
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value && typeof value === 'object' && detectCyclicReferences(value, seen)) {
        return true;
      }
    }
  }
  
  return false;
};
