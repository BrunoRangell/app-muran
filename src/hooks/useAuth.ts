import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Debounce para evitar verificações excessivas
let checkSessionTimeout: NodeJS.Timeout | null = null;

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função para verificação da sessão com debounce otimizado
  const checkSession = useCallback(async (immediate = false) => {
    if (checkSessionTimeout && !immediate) {
      clearTimeout(checkSessionTimeout);
    }

    const performCheck = async () => {
      try {
        console.log('🔍 Verificando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
        } else {
          console.log('✅ Sessão encontrada:', { 
            hasSession: !!session, 
            userId: session?.user?.id,
            email: session?.user?.email 
          });
          setIsAuthenticated(!!session);
          setUser(session?.user || null);
          setSession(session);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (immediate) {
      performCheck();
    } else {
      checkSessionTimeout = setTimeout(performCheck, 300); // Reduzido para 300ms
    }
  }, []);

  useEffect(() => {
    // Verificação inicial imediata
    checkSession(true);

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        setIsAuthenticated(!!session);
        setUser(session?.user || null);
        setSession(session);
        setIsLoading(false);
      }
    );

    // Listener para mudanças de foco da página
    const handleFocus = () => {
      console.log('🔄 Página ficou em foco, re-verificando sessão');
      checkSession(true); // Verificação imediata no foco
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      if (checkSessionTimeout) {
        clearTimeout(checkSessionTimeout);
      }
    };
  }, [checkSession]);

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando processo de logout...');
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout no Supabase:', error);
      }

      // Limpar dados locais
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Logout realizado com sucesso');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      // Redirecionar para login
      navigate("/login", { replace: true });
      
    } catch (error) {
      console.error('Erro inesperado ao fazer logout:', error);
      
      // Mesmo com erro, limpar dados locais
      localStorage.clear();
      sessionStorage.clear();

      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado, mas você foi desconectado.",
      });
      
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    logout
  };
};