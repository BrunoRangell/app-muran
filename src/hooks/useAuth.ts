import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);

  // Otimizado checkSession com debounce reduzido
  const checkSession = useCallback(async (immediate = false) => {
    const now = Date.now();
    
    // Verificação imediata ao focar página
    if (!immediate && now - lastCheckRef.current < 300) {
      return;
    }

    if (checkingRef.current) return;

    try {
      checkingRef.current = true;
      lastCheckRef.current = now;
      
      console.log('🔍 Verificando sessão otimizada...');
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
      checkingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificação inicial
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

    // Listener para foco - verificação imediata
    const handleFocus = () => {
      console.log('👁️ Foco detectado, verificando sessão');
      checkSession(true);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
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