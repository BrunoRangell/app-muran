
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { errorMessages } from "@/lib/errors";
import { useToast } from "@/components/ui/use-toast";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação do usuário...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erro ao verificar sessão:", {
            error: sessionError,
            timestamp: new Date().toISOString()
          });
          setIsAuthenticated(false);
          toast({
            title: "Erro de autenticação",
            description: errorMessages.AUTH_EXPIRED,
            variant: "destructive",
          });
          return;
        }

        if (!session) {
          console.log("Nenhuma sessão encontrada");
          setIsAuthenticated(false);
          return;
        }

        // Verifica se há dados de autenticação no localStorage
        const authData = localStorage.getItem('muran-auth-token');
        if (!authData) {
          console.warn("Dados de autenticação não encontrados no localStorage");
          setIsAuthenticated(false);
          return;
        }

        console.log("Sessão válida encontrada");
        setIsAuthenticated(true);

        if (requireAdmin) {
          console.log("Verificando permissões do usuário...");
          const { data: teamMember, error: teamError } = await supabase
            .from('team_members')
            .select('role, permission')
            .eq('email', session.user.email)
            .single();

          if (teamError) {
            console.error("Erro ao verificar permissões:", {
              error: teamError,
              timestamp: new Date().toISOString()
            });
            setIsAdmin(false);
            toast({
              title: "Erro de permissão",
              description: errorMessages.PERMISSION_DENIED,
              variant: "destructive",
            });
            return;
          }

          const userIsAdmin = teamMember?.permission === 'admin';
          console.log("Usuário é admin?", userIsAdmin);
          setIsAdmin(userIsAdmin);

          if (!userIsAdmin) {
            toast({
              title: "Acesso negado",
              description: errorMessages.PERMISSION_DENIED,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", {
          error,
          timestamp: new Date().toISOString()
        });
        setIsAuthenticated(false);
        setIsAdmin(false);
        toast({
          title: "Erro",
          description: errorMessages.OPERATION_FAILED,
          variant: "destructive",
        });
      }
    };

    // Verifica autenticação imediatamente
    checkAuth();

    // Configura listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Mudança no estado de autenticação:", {
        event,
        timestamp: new Date().toISOString()
      });
      
      if (!session) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        return;
      }

      setIsAuthenticated(true);
      
      if (requireAdmin) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('permission')
          .eq('email', session.user.email)
          .single();
        
        setIsAdmin(teamMember?.permission === 'admin');
      }
    });

    // Verifica a sessão periodicamente
    const interval = setInterval(checkAuth, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
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
