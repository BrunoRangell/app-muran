import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ManagerLoginFormProps {
  managerId: string;
  managerName: string;
  onClose: () => void;
}

export const ManagerLoginForm = ({ managerId, managerName, onClose }: ManagerLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Tentando fazer login com:", { managerId, password });

      // Primeiro, buscar o email do gestor
      const { data: managerData, error: managerError } = await supabase
        .from('team_members')
        .select('email')
        .eq('id', managerId)
        .single();

      if (managerError) throw managerError;
      if (!managerData?.email) throw new Error("Email do gestor não encontrado");

      // Agora fazer login usando o sistema de autenticação do Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: managerData.email,
        password: password
      });

      if (signInError) throw signInError;

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${managerName}!`,
      });

      onClose();
      navigate("/gestor/financeiro");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: "Senha incorreta ou usuário não encontrado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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