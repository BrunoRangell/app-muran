import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface ManagerLoginFormProps {
  managerId: number;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `gestor${managerId}@muran.com`,
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${managerName}!`,
        });
        navigate("/gestor/financeiro");
      }
    } catch (error) {
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