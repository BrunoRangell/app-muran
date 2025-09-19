import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePageVisibility = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Página voltou ao foco - validando dados críticos');
        
        // Invalida apenas queries críticas de autenticação
        const criticalQueries = ['auth-session', 'user-profile'];
        
        criticalQueries.forEach(queryKey => {
          const queryData = queryClient.getQueryData([queryKey]);
          if (!queryData) {
            console.log(`⚠️ Query ${queryKey} sem dados - invalidando`);
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        });

        // Força reload apenas se não houver nenhuma query de sessão
        const hasSessionData = queryClient.getQueryData(['auth-session']);
        if (!hasSessionData) {
          console.log('🔥 Nenhuma sessão encontrada - forçando reload');
          window.location.reload();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
};