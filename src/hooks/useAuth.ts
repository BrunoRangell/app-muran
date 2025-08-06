import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Monitorar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
    logout
  };
};