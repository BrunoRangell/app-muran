
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMessages = {
  // Erros de autenticação
  AUTH_EXPIRED: 'Sua sessão expirou. Por favor, faça login novamente.',
  AUTH_INVALID: 'Credenciais inválidas. Verifique seus dados e tente novamente.',
  AUTH_REQUIRED: 'Você precisa estar logado para acessar esta funcionalidade.',
  
  // Erros de operação
  OPERATION_FAILED: 'Não foi possível completar a operação. Tente novamente.',
  VALIDATION_ERROR: 'Por favor, verifique os dados informados.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  
  // Erros de permissão
  PERMISSION_DENIED: 'Você não tem permissão para realizar esta ação.',
  
  // Erros do Supabase
  SUPABASE_ERROR: 'Erro na comunicação com o servidor.',
};

export const handleApiError = (error: any): AppError => {
  console.error('API Error:', {
    error,
    timestamp: new Date().toISOString(),
    stack: error.stack
  });

  if (error instanceof AppError) {
    return error;
  }

  // Erros do Supabase
  if (error.message?.includes('refresh_token_not_found')) {
    return new AppError(errorMessages.AUTH_EXPIRED, 'AUTH_EXPIRED');
  }

  if (error.code === 'PGRST301') {
    return new AppError(errorMessages.AUTH_REQUIRED, 'AUTH_REQUIRED');
  }

  // Erros de rede
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network Error')) {
    return new AppError(errorMessages.NETWORK_ERROR, 'NETWORK_ERROR');
  }

  return new AppError(
    errorMessages.OPERATION_FAILED,
    'UNKNOWN_ERROR',
    { originalError: error }
  );
};
