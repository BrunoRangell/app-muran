
import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
  const authCheckRef = useRef<NodeJS.Timeout | null>(null);
  const initialCheckDone = useRef(false);

  // Função para verificar a autenticação com lógica melhorada
  const checkAuth = async () => {
    try {
      if (!initialCheckDone.current) {
        console.log("Verificação inicial de autenticação...");
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erro ao verificar sessão:", {
          error: sessionError,
          timestamp: new Date().toISOString()
        });
        
        // Tenta renovar a sessão antes de falhar
        try {
          console.log("Tentando renovar sessão após erro...");
          const { data } = await supabase.auth.refreshSession();
          
          if (data.session) {
            console.log("Sessão renovada com sucesso após erro.");
            setIsAuthenticated(true);
            
            if (requireAdmin) {
              await checkAdminStatus(data.session.user.email);
            }
            
            return;
          }
        } catch (refreshError) {
          console.error("Erro ao renovar sessão após erro inicial:", refreshError);
        }
        
        setIsAuthenticated(false);
        if (requireAdmin) setIsAdmin(false);
        
        toast({
          title: "Erro de autenticação",
          description: errorMessages.AUTH_EXPIRED,
          variant: "destructive",
        });
        return;
      }

      if (!session) {
        console.log("Nenhuma sessão encontrada");
        
        // Tenta renovar a sessão antes de falhar
        try {
          console.log("Tentando renovar sessão inexistente...");
          const { data } = await supabase.auth.refreshSession();
          
          if (data.session) {
            console.log("Sessão criada com sucesso após não encontrar sessão.");
            setIsAuthenticated(true);
            
            if (requireAdmin) {
              await checkAdminStatus(data.session.user.email);
            }
            
            return;
          }
        } catch (refreshError) {
          console.error("Erro ao tentar renovar sessão inexistente:", refreshError);
        }
        
        setIsAuthenticated(false);
        if (requireAdmin) setIsAdmin(false);
        return;
      }

      // Se chegou aqui, o usuário está autenticado
      console.log("Sessão válida encontrada", {
        user: session.user.email,
        expires: new Date(session.expires_at! * 1000)
      });
      setIsAuthenticated(true);

      if (requireAdmin) {
        await checkAdminStatus(session.user.email);
      }
      
      initialCheckDone.current = true;
    } catch (error) {
      console.error("Erro inesperado ao verificar autenticação:", {
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
  
  // Função específica para verificar status de admin
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
      console.log("Usuário é admin?", userIsAdmin, {
        email: email,
        role: teamMember?.role,
        permission: teamMember?.permission
      });
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
        await checkAdminStatus(session.user.email);
      }
    });

    // Limpa a verificação anterior e configura nova verificação periódica
    if (authCheckRef.current) {
      clearInterval(authCheckRef.current);
    }
    
    // Verifica a sessão periodicamente com um intervalo mais longo
    authCheckRef.current = setInterval(() => {
      // Ignora verificações na página de login
      if (window.location.pathname !== '/login') {
        checkAuth();
      }
    }, 5 * 60 * 1000); // Verifica a cada 5 minutos

    return () => {
      subscription.unsubscribe();
      if (authCheckRef.current) {
        clearInterval(authCheckRef.current);
      }
    };
  }, [requireAdmin, toast, location.pathname]);

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
