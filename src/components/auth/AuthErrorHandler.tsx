
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const AuthErrorHandler = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Listener para erros de autenticação específicos do RLS
    const handleAuthError = (error: any) => {
      if (error?.message?.includes('permission denied')) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar este recurso. Entre em contato com um administrador.",
          variant: "destructive",
        });
      } else if (error?.message?.includes('row-level security')) {
        toast({
          title: "Erro de Segurança",
          description: "Problema de autorização. Verifique se você está logado corretamente.",
          variant: "destructive",
        });
      } else if (error?.message?.includes('not authenticated')) {
        toast({
          title: "Não Autenticado",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive",
        });
      }
    };

    // Interceptar erros do Supabase
    const originalError = console.error;
    console.error = (...args) => {
      const error = args[0];
      if (typeof error === 'object' && error?.message) {
        handleAuthError(error);
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, [toast]);

  return null;
};
