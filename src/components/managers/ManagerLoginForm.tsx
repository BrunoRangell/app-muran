import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface ManagerLoginFormProps {
  managerId: string;
  managerName: string;
  onClose: () => void;
}

export const ManagerLoginForm = ({ managerId, managerName, onClose }: ManagerLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Tentando fazer login com:', { managerId, password });
      
      // Primeiro verificar se o usuário existe na tabela team_members
      const { data: manager, error: managerError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', managerId)
        .eq('password', password)
        .single();

      if (managerError) throw managerError;

      if (manager) {
        console.log('Login bem sucedido:', manager);
        
        try {
          // Tentar criar sessão no Supabase
          const { error: sessionError } = await supabase.auth.signInWithPassword({
            email: manager.email,
            password: password
          });

          if (sessionError) {
            // Se o erro for de email não confirmado, permitir o login mesmo assim
            if (sessionError.message === "Email not confirmed") {
              toast({
                title: "Login realizado com sucesso",
                description: `Bem-vindo, ${managerName}!`,
              });
              navigate("/gestor/financeiro");
              return;
            }
            throw sessionError;
          }

          toast({
            title: "Login realizado com sucesso",
            description: `Bem-vindo, ${managerName}!`,
          });
          navigate("/gestor/financeiro");
        } catch (authError: any) {
          console.error('Erro de autenticação:', authError);
          // Se o erro for de email não confirmado, permitir o login mesmo assim
          if (authError.message === "Email not confirmed") {
            toast({
              title: "Login realizado com sucesso",
              description: `Bem-vindo, ${managerName}!`,
            });
            navigate("/gestor/financeiro");
            return;
          }
          throw authError;
        }
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Senha incorreta ou erro ao criar sessão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};