import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro na verificação do email:', error);
        toast({
          title: "Erro na verificação",
          description: "Não foi possível verificar seu email. Por favor, solicite um novo link de verificação.",
          variant: "destructive",
        });
        navigate('/gestores');
        return;
      }

      toast({
        title: "Email verificado",
        description: "Seu email foi verificado com sucesso. Você já pode fazer login.",
      });
      navigate('/gestores');
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Verificando...</p>
    </div>
  );
};