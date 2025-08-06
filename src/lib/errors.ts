export const errorMessages = {
  AUTH_EXPIRED: 'Sua sessão expirou. Por favor, faça login novamente.',
  AUTH_INVALID: 'Sessão inválida. Por favor, faça login novamente.',
  AUTH_FAILED: 'Falha na autenticação. Tente novamente.',
  PERMISSION_DENIED: 'Acesso negado. Você não tem permissão para acessar esta área.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  VALIDATION_ERROR: 'Dados inválidos fornecidos.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado.'
} as const;

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return error?.message || errorMessages.GENERIC_ERROR;
};

export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}