
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useUnifiedAuth();

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
    if (requireAdmin && user?.email) {
      checkAdminStatus(user.email);
    }
  }, [requireAdmin, user?.email, toast]);

  // Timeout de segurança para loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Timeout de loading no PrivateRoute');
        setLoadingTimeout(true);
      }
    }, 8000); // 8 segundos

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Estado de carregamento com timeout
  if ((isLoading && !loadingTimeout) || (requireAdmin && isAdmin === null && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muran-secondary">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-muran-primary mx-auto"></div>
          <p className="text-sm text-gray-600">
            {loadingTimeout ? "Verificando autenticação..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  // Redireciona se não estiver autenticado
  if (!isAuthenticated || loadingTimeout) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redireciona se não for admin (quando necessário)
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
