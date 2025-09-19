import { useUnifiedAuth } from './useUnifiedAuth';

// Legacy hook - use useUnifiedAuth for new implementations
export const useAuth = () => {
  return useUnifiedAuth();
};