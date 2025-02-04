import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Mail, Key, Info, Loader2 } from "lucide-react";
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado. Verifique sua caixa de entrada.");
        }
        setShowError(true);
        throw new Error("Conta não encontrada. Entre em contato com a administração.");
      }

      if (!data.user) throw new Error("Usuário não encontrado");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Erro ao estabelecer sessão");

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo(a) de volta!",
      });

      navigate("/");
    } catch (error: any) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muran-secondary to-muran-primary/20 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto animate-fade-in"
            />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-muran-complementary">
                Bem-vindo(a) de volta
              </h2>
              <p className="text-gray-600 text-sm">
                Faça login para acessar sua conta
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {showError && (
            <Alert className="bg-orange-50 border-orange-200 text-orange-800 animate-shake">
              <Info className="h-5 w-5" />
              <AlertDescription className="ml-2 text-sm">
                Conta não encontrada. Entre em contato com a administração.
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 focus:ring-muran-primary focus:border-muran-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 focus:ring-muran-primary focus:border-muran-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-muran-primary hover:bg-muran-primary/90 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        {/* Footer Section */}
        <div className="bg-muran-primary/10 p-4 text-center">
          <p className="text-sm text-gray-600">
            Precisa de ajuda?{" "}
            <a href="#" className="text-muran-primary hover:underline">
              Contate a administração
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
