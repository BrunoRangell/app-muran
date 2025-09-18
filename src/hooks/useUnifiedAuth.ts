import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface UseUnifiedAuthReturn {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<boolean>;
}

export const useUnifiedAuth = (): UseUnifiedAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced session check com verificação imediata em foco
  const checkSession = useCallback(async (immediate = false) => {
    const now = Date.now();
    
    // Se não for imediato e ainda está dentro do debounce, ignorar
    if (!immediate && now - lastCheckRef.current < 300) {
      return;
    }

    // Se já está verificando, aguardar
    if (checkingRef.current) {
      return;
    }

    try {
      checkingRef.current = true;
      lastCheckRef.current = now;
      
      console.log('🔍 Verificando sessão unificada...');
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setSession(null);
        setUser(null);
        return false;
      }

      if (currentSession) {
        console.log('✅ Sessão válida encontrada');
        setSession(currentSession);
        setUser(currentSession.user);
        return true;
      } else {
        console.log('⚠️ Nenhuma sessão encontrada');
        setSession(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro inesperado na verificação:', error);
      setSession(null);
      setUser(null);
      return false;
    } finally {
      checkingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Refresh da sessão
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Forçando refresh da sessão...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao refresh da sessão:', error);
        return false;
      }
      
      if (data.session) {
        console.log('✅ Sessão refreshed com sucesso');
        setSession(data.session);
        setUser(data.session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro inesperado no refresh:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state change:', { 
          event, 
          hasSession: !!newSession,
          userId: newSession?.user?.id 
        });

        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);

        // Teste RLS apenas para eventos de login/signup
        if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(async () => {
            try {
              console.log('🧪 Testando RLS após auth change...');
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
          }, 0);
        }
      }
    );

    // Verificação inicial da sessão
    checkSession(true);

    // Timeout de segurança para loading
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Timeout de loading atingido, forçando fim do loading');
        setIsLoading(false);
      }
    }, 10000); // 10 segundos

    // Listener para foco da página (verificação imediata)
    const handleFocus = () => {
      console.log('👁️ Página focada, verificando sessão imediatamente');
      checkSession(true);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkSession]);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    refreshSession
  };
};