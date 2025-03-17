
/**
 * Processa e formata detalhes de erros para apresentação e depuração
 */
export const processErrorDetails = (err: any): { 
  message: string;
  details: any;
} => {
  console.error("[errorProcessor] Erro na análise:", err);
  
  // Extrair mensagem de erro
  const errorMessage = err instanceof Error ? err.message : String(err) || "Erro desconhecido";
  
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
      errorMessage.includes("OAuth") || errorMessage.includes("credenciais")) {
    errorType = "TOKEN_ERROR";
  } else if (errorMessage.includes("Edge") || errorMessage.includes("função") ||
            errorMessage.includes("Function") || errorMessage.includes("supabase")) {
    errorType = "EDGE_FUNCTION_ERROR";
  } else if (errorMessage.includes("rede") || errorMessage.includes("Network") || 
            errorMessage.includes("fetch") || errorMessage.includes("timeout") ||
            errorMessage.includes("conectar")) {
    errorType = "NETWORK_ERROR";
  } else if (errorMessage.includes("JSON") || errorMessage.includes("parse") ||
            errorMessage.includes("formato")) {
    errorType = "PARSING_ERROR";
  } else if (errorMessage.includes("orçamento") || errorMessage.includes("budget") ||
            errorMessage.includes("cálculo")) {
    errorType = "BUDGET_CALCULATION_ERROR";
  }
  
  errorDetails.errorType = errorType;
  
  // Formatar mensagem de erro para ser mais amigável
  let friendlyMessage = errorMessage;
  
  if (errorType === "TOKEN_ERROR") {
    friendlyMessage = "Erro de autenticação com o Meta Ads. Verifique se o token está válido.";
  } else if (errorType === "EDGE_FUNCTION_ERROR") {
    friendlyMessage = "Erro ao executar a função de processamento. O serviço pode estar indisponível.";
  } else if (errorType === "NETWORK_ERROR") {
    friendlyMessage = "Erro de conexão com o servidor. Verifique sua conexão à internet.";
  } else if (errorType === "PARSING_ERROR") {
    friendlyMessage = "Erro ao processar a resposta da API. Formato inválido.";
  } else if (errorType === "BUDGET_CALCULATION_ERROR") {
    friendlyMessage = "Erro ao calcular orçamentos. Verifique os valores informados.";
  }
  
  return {
    message: friendlyMessage,
    details: errorDetails
  };
};
