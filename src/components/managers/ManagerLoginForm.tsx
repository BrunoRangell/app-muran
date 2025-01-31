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
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', managerId)
        .eq('password', password)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Login bem sucedido:', data);
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${managerName}!`,
        });
        navigate("/gestor/financeiro");
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Senha incorreta. Tente novamente.",
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