import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePageVisibility = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('📱 Página voltou ao foco, verificando auth e invalidando queries críticas...');
        
        try {
          // Verificar se há sessão válida
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Erro ao verificar sessão na visibilidade:', error);
            // Se erro de auth, invalidar tudo para forçar re-login
            queryClient.invalidateQueries();
            return;
          }

          if (!session) {
            console.log('⚠️ Sem sessão válida, invalidando todas as queries');
            queryClient.invalidateQueries();
            return;
          }

          console.log('✅ Sessão válida encontrada, invalidando queries específicas');
          
          // Invalidar apenas queries críticas de auth e dados do usuário
          const criticalQueries = [
            ['team_members'],
            ['auth_session'],
            ['user_profile'],
            ['client_metrics']
          ];

          // Verificar se as queries existem antes de invalidar
          criticalQueries.forEach(queryKey => {
            const hasQuery = queryClient.getQueryData(queryKey);
            if (hasQuery) {
              console.log(`🔄 Invalidando query: ${queryKey.join('.')}`);
              queryClient.invalidateQueries({ queryKey });
            }
          });

          // Se não há queries em cache, força reload completo
          const allQueries = queryClient.getQueryCache().getAll();
          if (allQueries.length === 0) {
            console.log('⚠️ Nenhuma query em cache, forçando reload');
            window.location.reload();
          }

        } catch (error) {
          console.error('❌ Erro ao processar mudança de visibilidade:', error);
          // Em caso de erro, invalidar tudo para garantir estado limpo
          queryClient.invalidateQueries();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [queryClient]);
};