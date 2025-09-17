import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { usePageVisibility } from './usePageVisibility';
import { Session, User } from '@supabase/supabase-js';

export const useUnifiedAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isVisible } = usePageVisibility();

  // Timeout para estados de loading que ficam travados
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Timeout de loading atingido, forçando estado não autenticado');
        setIsAuthenticated(false);
        setIsLoading(false);
        setUser(null);
        setSession(null);
      }, 10000); // 10 segundos

      setLoadingTimeout(timeout);
      return () => clearTimeout(timeout);
    } else {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
  }, [isLoading, loadingTimeout]);

  // Função de verificação de sessão unificada
  const checkSession = useCallback(async (force = false) => {
    const now = Date.now();
    
    if (!force && now - lastCheck < 300) {
      console.log('🔄 Verificação de sessão em debounce...');
      return;
    }
    
    setLastCheck(now);
    
    try {
      console.log('🔍 Verificando sessão unificada...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setIsAuthenticated(false);
        setUser(null);
        setSession(null);
      } else {
        console.log('✅ Sessão verificada:', { 
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
  }, [lastCheck]);

  useEffect(() => {
    // Verificação inicial
    checkSession(true);

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        setLastCheck(Date.now());

        // Teste de RLS após mudança de estado
        if (session) {
          try {
            console.log('🧪 Testando RLS após auth state change...');
            const { error } = await supabase
              .from('team_members')
              .select('email')
              .limit(1);
            
            if (error) {
              console.error('❌ Erro no teste RLS:', error);
            } else {
              console.log('✅ Teste RLS passou');
            }
          } catch (error) {
            console.error('❌ Erro no teste RLS:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkSession]);

  // Verificar sessão quando página volta ao foco
  useEffect(() => {
    if (isVisible && !isLoading) {
      console.log('🔄 Página voltou ao foco, verificação imediata...');
      checkSession(true);
    }
  }, [isVisible, checkSession, isLoading]);

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Iniciando logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro no logout:', error);
      }

      // Limpar dados locais
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ Logout realizado');
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
        description: "Erro inesperado, mas você foi desconectado.",
      });
      
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 Forçando refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao refresh:', error);
        return false;
      }
      
      if (data.session) {
        console.log('✅ Sessão refreshed');
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro no refresh:', error);
      return false;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    logout,
    refreshSession,
    checkSession
  };
};