import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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
      console.log("Iniciando tentativa de login com email:", managerName);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: managerName,
        password: password,
      });

      if (error) {
        console.error("Erro no login:", error);
        throw error;
      }

      console.log("Login bem sucedido para o usuário:", managerName);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });

      onClose();
      navigate("/financeiro");
    } catch (error) {
      console.error("Erro durante o login:", error);
      toast({
        title: "Erro no login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto px-4">
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};