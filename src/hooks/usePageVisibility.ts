import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePageVisibility() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página ficou visível - revalidando queries críticas');
        
        // Invalidar apenas queries críticas relacionadas à autenticação
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            if (!queryKey || !Array.isArray(queryKey)) return false;
            
            // Invalidar queries de sessão, perfil do usuário e métricas principais
            const criticalKeys = ['session', 'user', 'profile', 'team-member'];
            return criticalKeys.some(key => 
              queryKey.some(k => typeof k === 'string' && k.includes(key))
            );
          }
        });

        // Tentar refetch da sessão se necessário
        setTimeout(() => {
          const sessionQueries = queryClient.getQueriesData({ queryKey: ['session'] });
          if (sessionQueries.length === 0) {
            console.log('🔄 Nenhuma query de sessão encontrada, forçando reload');
            window.location.reload();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);
}