
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { errorMessages } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  // Função para verificar status de admin
  const checkAdminStatus = async (email: string | undefined) => {
    if (!email) {
      setIsAdmin(false);
      return;
    }
    
    try {
      console.log("Verificando permissões do usuário...");
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('role, permission')
        .eq('email', email)
        .single();

      if (teamError) {
        console.error("Erro ao verificar permissões:", teamError);
        setIsAdmin(false);
        if (requireAdmin) {
          toast({
            title: "Erro de permissão",
            description: errorMessages.PERMISSION_DENIED,
            variant: "destructive",
          });
        }
        return;
      }

      const userIsAdmin = teamMember?.permission === 'admin';
      console.log("Usuário é admin?", userIsAdmin);
      setIsAdmin(userIsAdmin);

      if (!userIsAdmin && requireAdmin) {
        toast({
          title: "Acesso negado",
          description: errorMessages.PERMISSION_DENIED,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status de admin:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          return;
        }

        setIsAuthenticated(true);
        
        if (requireAdmin) {
          await checkAdminStatus(session.user.email);
        }
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    initializeAuth();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Mudança no estado de autenticação:", event);
      
      if (!session) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        return;
      }

      setIsAuthenticated(true);
      
      if (requireAdmin) {
        await checkAdminStatus(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requireAdmin, toast]);

  // Estado de carregamento
  if (isAuthenticated === null || (requireAdmin && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muran-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-muran-primary"></div>
      </div>
    );
  }

  // Redireciona se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redireciona se não for admin (quando necessário)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
