
import { showErrorToast } from "@/utils/toastUtils";

// Tipos de erro padronizados
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  PERMISSION = "PERMISSION",
  UNKNOWN = "UNKNOWN"
}

// Mensagens de erro padronizadas
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: "Erro de conexão. Verifique sua internet e tente novamente.",
  [ErrorType.AUTHENTICATION]: "Sessão expirada. Faça login novamente.",
  [ErrorType.VALIDATION]: "Dados inválidos. Verifique as informações preenchidas.",
  [ErrorType.NOT_FOUND]: "Recurso não encontrado.",
  [ErrorType.PERMISSION]: "Você não tem permissão para realizar esta operação.",
  [ErrorType.UNKNOWN]: "Ocorreu um erro inesperado. Tente novamente."
};

// Função para classificar erro baseado na mensagem/código
export const classifyError = (error: any): ErrorType => {
  const message = error?.message?.toLowerCase() || "";
  const status = error?.status || error?.code;

  if (status === 401 || message.includes("unauthorized")) {
    return ErrorType.AUTHENTICATION;
  }
  
  if (status === 403 || message.includes("permission")) {
    return ErrorType.PERMISSION;
  }
  
  if (status === 404 || message.includes("not found")) {
    return ErrorType.NOT_FOUND;
  }
  
  if (status >= 400 && status < 500) {
    return ErrorType.VALIDATION;
  }
  
  if (message.includes("network") || message.includes("fetch")) {
    return ErrorType.NETWORK;
  }
  
  return ErrorType.UNKNOWN;
};

// Função unificada para tratamento de erros
export const handleError = (error: any, context?: string) => {
  const errorType = classifyError(error);
  const message = ERROR_MESSAGES[errorType];
  
  showErrorToast("Erro", message);
  
  return {
    type: errorType,
    message,
    originalError: error
  };
};

// Hook para tratamento unificado de erros
export const useErrorHandler = () => {
  return {
    handleError,
    classifyError,
    ErrorType
  };
};
