import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Mail, Key, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
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

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setShowError(false);

    try {
      console.log("Iniciando tentativa de login com email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro detalhado do Supabase:", error);
        
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação.");
        }
        
        setShowError(true);
        throw new Error("Conta não encontrada. Por favor, entre em contato com a administração da Muran para solicitar a criação de sua conta.");
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
      
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muran-secondary p-4">
      <div className="w-full max-w-md space-y-8 p-4 md:p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center space-y-6">
          <img
            src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
            alt="Muran Logo"
            className="mx-auto h-20 md:h-32 w-auto"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-muran-complementary">
            Bem-vindo(a) de volta
          </h2>
          <p className="text-sm text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        {showError && (
          <Alert className="bg-orange-50 border-orange-200 text-orange-800">
            <Info className="h-5 w-5" />
            <AlertDescription className="ml-2 text-sm">
              Conta não encontrada. Por favor, entre em contato com a administração da Muran para solicitar a criação de sua conta.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
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