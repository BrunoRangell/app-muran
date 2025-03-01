
/**
 * Processa e formata detalhes de erros para apresentação e depuração
 */
export const processErrorDetails = (err: any): { 
  message: string;
  details: any;
} => {
  console.error("[errorProcessor] Erro na análise:", err);
  
  // Extrair mensagem de erro
  const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
  
  // Extrair mais informações do erro para depuração
  let errorDetails: any = {};
  
  if (err instanceof Error) {
    errorDetails = {
      name: err.name,
      message: err.message,
      details: err.stack
    };
  } else if (typeof err === 'object' && err !== null) {
    try {
      errorDetails = {
        ...err,
        stringified: JSON.stringify(err)
      };
    } catch (e) {
      errorDetails = { raw: String(err) };
    }
  } else {
    errorDetails = {
      raw: String(err)
    };
  }
  
  // Tentar identificar tipo específico de erro
  let errorType = "UNKNOWN_ERROR";
  
  if (errorMessage.includes("Token") || errorMessage.includes("token") || 
      errorMessage.includes("OAuth")) {
    errorType = "TOKEN_ERROR";
  } else if (errorMessage.includes("Edge") || errorMessage.includes("função")) {
    errorType = "EDGE_FUNCTION_ERROR";
  } else if (errorMessage.includes("rede") || errorMessage.includes("Network") || 
            errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
    errorType = "NETWORK_ERROR";
  } else if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
    errorType = "PARSING_ERROR";
  }
  
  errorDetails.errorType = errorType;
  
  return {
    message: errorMessage,
    details: errorDetails
  };
};

