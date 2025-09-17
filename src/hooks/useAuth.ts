import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { usePageVisibility } from './usePageVisibility';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isVisible } = usePageVisibility();

  // Função de verificação de sessão com debounce
  const checkSession = useCallback(async () => {
    const now = Date.now();
    // Evitar múltiplas verificações em menos de 1 segundo
    if (now - lastCheck < 1000) {
      console.log('🔄 Verificação de sessão em debounce, aguardando...');
      return;
    }
    
    setLastCheck(now);
    
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
  }, [lastCheck]);

  useEffect(() => {

    // Verificação inicial
    checkSession();

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
        setLastCheck(Date.now()); // Atualizar timestamp da última verificação
      }
    );

    return () => subscription.unsubscribe();
  }, [checkSession]);

  // Revalidar sessão quando a página volta ao foco
  useEffect(() => {
    if (isVisible && !isLoading) {
      console.log('🔄 Página voltou ao foco, verificando sessão...');
      checkSession();
    }
  }, [isVisible, checkSession, isLoading]);

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