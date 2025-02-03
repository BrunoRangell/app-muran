import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando sessão do usuário...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erro ao verificar sessão:", sessionError);
          setIsAuthenticated(false);
          return;
        }

        if (!session) {
          console.log("Nenhuma sessão encontrada");
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
            console.error("Erro ao verificar permissões:", teamError);
            setIsAdmin(false);
            return;
          }

          const userIsAdmin = teamMember?.permission === 'admin';
          console.log("Usuário é admin?", userIsAdmin);
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Mudança no estado de autenticação:", event);
      setIsAuthenticated(!!session);
      
      if (!session) {
        setIsAdmin(false);
        return;
      }

      if (requireAdmin && session) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('permission')
          .eq('email', session.user.email)
          .single();
        
        setIsAdmin(teamMember?.permission === 'admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [requireAdmin]);

  if (isAuthenticated === null || (requireAdmin && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muran-secondary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-muran-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};