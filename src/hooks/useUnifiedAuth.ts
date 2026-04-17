import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, clearSupabaseLocalSession } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

export const useUnifiedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const refreshInFlight = useRef(false);
  const lastFocusCheck = useRef(0);

  const checkSession = useCallback(async (isBackgroundCheck = false) => {
    try {
      if (isBackgroundCheck) setIsRevalidating(true);
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        // Em verificação background NÃO derruba estado de auth
        // (evita loop de logout quando a rede falha temporariamente).
        if (!isBackgroundCheck) {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession);
    } catch {
      if (!isBackgroundCheck) {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshInFlight.current) return false;
    refreshInFlight.current = true;
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error || !refreshedSession) return false;
      setSession(refreshedSession);
      setUser(refreshedSession.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearSupabaseLocalSession();
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
    const loadingTimeout = setTimeout(() => setIsLoading(false), 10000);

    // PRIMEIRO o listener, depois a checagem inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsAuthenticated(!!newSession);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [checkSession]);

  // Revalidação em foco: SOMENTE se já estiver autenticado e com throttle de 60s.
  // Evita tempestade de refresh_token quando a rede está caída na tela de login.
  useEffect(() => {
    const handleFocus = () => {
      if (!isAuthenticated) return;
      const now = Date.now();
      if (now - lastFocusCheck.current < 60_000) return;
      lastFocusCheck.current = now;
      checkSession(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSession, isAuthenticated]);

  return {
    user,
    session,
    isLoading,
    isRevalidating,
    isAuthenticated,
    logout,
    refreshSession,
    checkSession,
  };
};
