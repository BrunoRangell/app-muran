import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      console.log("Iniciando tentativa de login com email:", email);
      console.log("URL do Supabase:", import.meta.env.VITE_SUPABASE_URL);
      
      // Primeiro, vamos verificar se o usuário existe
      const { data: userExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!userExists) {
        throw new Error("Usuário não encontrado. Por favor, registre-se primeiro.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Resposta do Supabase:", { data, error });

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação.");
        }
        if (error.message === "Invalid login credentials") {
          throw new Error("Senha incorreta. Por favor, verifique suas credenciais e tente novamente.");
        }
        throw error;
      }

      if (!data.user) {
        throw new Error("Usuário não encontrado na resposta");
      }

      console.log("Login bem sucedido para o usuário:", data.user.email);

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo(a) de volta!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro completo no login:", error);
      
      let errorMessage = "Ocorreu um erro ao fazer login. Por favor, tente novamente mais tarde.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muran-secondary">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img
            src="/lovable-uploads/397f32ec-90a7-4d37-b618-cae2c3cef585.png"
            alt="Muran Logo"
            className="mx-auto h-12"
          />
          <h2 className="mt-6 text-3xl font-bold text-muran-complementary">
            Bem-vindo(a) de volta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-muran-primary hover:bg-muran-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;