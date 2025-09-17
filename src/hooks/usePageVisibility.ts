import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      console.log(`🔄 Visibilidade da página mudou: ${visible ? 'visível' : 'oculta'}`);
      
      if (visible) {
        // Quando a página volta ao foco, revalidar queries importantes
        console.log('🔄 Página voltou ao foco, revalidando dados...');
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            // Revalidar apenas queries relacionadas a autenticação e dados críticos
            const queryKey = query.queryKey[0] as string;
            return ['user-data', 'team-member', 'auth-session'].includes(queryKey);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Também escutar eventos de foco da janela
    const handleFocus = () => {
      if (!document.hidden) {
        console.log('🔄 Janela voltou ao foco');
        setIsVisible(true);
      }
    };
    
    const handleBlur = () => {
      console.log('🔄 Janela perdeu o foco');
      setIsVisible(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [queryClient]);

  return { isVisible };
};