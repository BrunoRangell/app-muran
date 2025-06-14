
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
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
        navigate('/login');
        return;
      }

      toast({
        title: "Email verificado",
        description: "Seu email foi verificado com sucesso. Você já pode fazer login.",
      });
      navigate('/');
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Verificando...</p>
    </div>
  );
}
