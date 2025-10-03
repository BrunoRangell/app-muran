import { useUnifiedAuth } from './useUnifiedAuth';

// Hook legado - mantido para compatibilidade retroativa
// IMPORTANTE: Utilize useUnifiedAuth diretamente para novas implementações
export const useAuthSession = () => {
  return useUnifiedAuth();
};