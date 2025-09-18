import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

interface UnifiedAuthState {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

// Cache para evitar múltiplas verificações simultâneas
let sessionCheckPromise: Promise<{ session: Session | null; user: User | null }> | null = null;

export const useUnifiedAuth = (): UnifiedAuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função otimizada para verificar sessão
  const checkSession = useCallback(async () => {
    if (sessionCheckPromise) {
      return sessionCheckPromise;
    }

    sessionCheckPromise = (async () => {
      try {
        console.log('🔍 Verificando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          return { session: null, user: null };
        }

        console.log('✅ Sessão verificada:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });

        return { session, user: session?.user || null };
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar sessão:', error);
        return { session: null, user: null };
      } finally {
        // Limpar cache após um pequeno delay
        setTimeout(() => {
          sessionCheckPromise = null;
        }, 300);
      }
    })();

    return sessionCheckPromise;
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Atualizando sessão...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao atualizar sessão:', error);
        return false;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        setIsAuthenticated(true);
        console.log('✅ Sessão atualizada com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar sessão:', error);
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Iniciando logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro ao fazer logout:', error);
      }

      // Limpar estado local
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ Logout realizado com sucesso');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });

      navigate("/login", { replace: true });
      
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error);
      
      localStorage.clear();
      sessionStorage.clear();

      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro, mas você foi desconectado.",
      });
      
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Timeout para evitar loading infinito
    loadingTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⚠️ Timeout no carregamento da autenticação');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 10000); // 10 segundos

    // Verificação inicial da sessão
    const initializeAuth = async () => {
      try {
        const { session, user } = await checkSession();
        
        if (!mounted) return;

        setSession(session);
        setUser(user);
        setIsAuthenticated(!!session);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setSession(null);
          setIsLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    initializeAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email 
        });

        setSession(session);
        setUser(session?.user || null);
        setIsAuthenticated(!!session);
        setIsLoading(false);
        clearTimeout(loadingTimeout);

        // Teste RLS após mudança de estado
        if (session) {
          try {
            console.log('🧪 Testando auth.uid()...');
            await supabase.from('team_members').select('id').limit(1);
            console.log('✅ Teste RLS passou');
          } catch (error) {
            console.error('❌ Erro no teste RLS:', error);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [checkSession]);

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    logout,
    refreshSession
  };
};