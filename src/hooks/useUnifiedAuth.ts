import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

let sessionCheckDebounce: NodeJS.Timeout;

export const useUnifiedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Otimized session check with debounce
  const checkSession = useCallback(async () => {
    if (sessionCheckDebounce) clearTimeout(sessionCheckDebounce);
    
    sessionCheckDebounce = setTimeout(async () => {
      try {
        console.log('🔍 Verificando sessão...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          console.log('✅ Sessão verificada:', currentSession ? 'Ativa' : 'Inativa');
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsAuthenticated(!!currentSession);
        }
      } catch (error) {
        console.error('💥 Erro inesperado na verificação:', error);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, []);

  // Session refresh mechanism
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Atualizando sessão...');
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao atualizar sessão:', error);
        return false;
      }
      
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        setIsAuthenticated(true);
        console.log('✅ Sessão atualizada com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('💥 Erro inesperado ao atualizar sessão:', error);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await supabase.auth.signOut();
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  }, [navigate]);

  useEffect(() => {
    console.log('🚀 Inicializando autenticação unificada');
    
    // Loading timeout - máximo 10 segundos
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Timeout de loading atingido');
      setIsLoading(false);
    }, 10000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔔 Auth event: ${event}`, session ? 'com sessão' : 'sem sessão');
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setIsLoading(false);
        
        clearTimeout(loadingTimeout);
      }
    );

    // Initial session check
    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
      if (sessionCheckDebounce) clearTimeout(sessionCheckDebounce);
    };
  }, [checkSession]);

  // Page focus handler
  useEffect(() => {
    const handleFocus = () => {
      console.log('👀 Página em foco - verificando sessão');
      checkSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSession]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    logout,
    refreshSession,
    checkSession
  };
};