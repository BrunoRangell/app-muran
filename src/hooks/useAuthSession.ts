import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Função para inicializar a sessão
    const initializeSession = async () => {
      try {
        console.log('🔍 Inicializando sessão...');
        
        // Primeiro, verificar se há uma sessão armazenada
        const { data: { session: storedSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao recuperar sessão:', error);
          setSession(null);
          setUser(null);
        } else if (storedSession) {
          console.log('✅ Sessão recuperada:', {
            userId: storedSession.user.id,
            email: storedSession.user.email,
            expiresAt: new Date(storedSession.expires_at! * 1000).toISOString()
          });
          setSession(storedSession);
          setUser(storedSession.user);
        } else {
          console.log('⚠️ Nenhuma sessão armazenada encontrada');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao inicializar sessão:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state change:', { 
          event, 
          hasSession: !!newSession,
          userId: newSession?.user?.id,
          email: newSession?.user?.email 
        });

        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);

        // Se a sessão for válida, verificar se auth.uid() funciona
        if (newSession) {
          try {
            console.log('🧪 Testando auth.uid() após mudança de estado...');
            const { data, error } = await supabase
              .from('team_members')
              .select('email')
              .limit(1);
            
            if (error) {
              console.error('❌ Erro no teste RLS:', error);
            } else {
              console.log('✅ Teste RLS passou, auth.uid() funcionando');
            }
          } catch (error) {
            console.error('❌ Erro no teste de auth.uid():', error);
          }
        }
      }
    );

    // Inicializar
    initializeSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
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
  };

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    refreshSession
  };
};