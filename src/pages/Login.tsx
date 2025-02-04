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
    <div className="min-h-screen flex items-center justify-center bg-[#321e32] p-4 relative overflow-hidden">
      {/* Fundo animado de ondas */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#321e32] via-[#ff6e00] to-[#321e32] animate-fluid" />
      
      {/* Card de Login */}
      <div className="w-full max-w-md bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-[1.005] relative overflow-hidden p-8">
        <div className="text-center space-y-6">
          <img
            src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
            alt="Muran Logo"
            className="mx-auto h-24 w-auto drop-shadow-lg hover:rotate-[5deg] transition-transform duration-300"
          />
          <h2 className="text-3xl font-bold text-[#0f0f0f]">
            Bem-vindo à<span className="block text-[#ff6e00]">Plataforma Muran</span>
          </h2>
          <p className="text-[#321e32]/80 text-sm font-medium">
            Sua jornada começa com um login
          </p>
        </div>

        {showError && (
          <Alert className="bg-[#ff6e00]/10 border-[#ff6e00]/30 text-[#0f0f0f] animate-shake">
            <Info className="h-5 w-5 text-[#ff6e00]" />
            <AlertDescription className="ml-2 text-sm">
              Conta não encontrada. Contate a administração.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10 border border-[#321e32]/30 focus:border-[#ff6e00] rounded-lg transition-all"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 border border-[#321e32]/30 focus:border-[#ff6e00] rounded-lg transition-all"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#ff6e00] hover:bg-[#ff6e00]/90 text-white transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-95 font-bold"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Acessar Plataforma"}
          </Button>
        </form>
      </div>
      <style jsx global>{`
        @keyframes fluid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fluid {
          background-size: 200% 200%;
          animation: fluid 10s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
