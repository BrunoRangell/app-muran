
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { errorMessages } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, user } = useUnifiedAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(requireAdmin);
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
    let mounted = true;
    
    // Loading state timeout - máximo 3 segundos (reduzido para melhor UX)
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ PrivateRoute loading timeout atingido');
      if (mounted) {
        setAdminLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        if (requireAdmin && user?.email && mounted) {
          await checkAdminStatus(user.email);
        } else if (!requireAdmin && mounted) {
          setAdminLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro no PrivateRoute initializeAuth:', error);
        if (mounted) {
          setAdminLoading(false);
        }
      }
    };

    if (!isLoading) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [requireAdmin, user?.email, isLoading]);

  // Estado de carregamento
  if (isLoading || (requireAdmin && adminLoading)) {
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
