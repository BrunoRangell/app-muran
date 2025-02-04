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
      {/* Fundo animado de ondas com efeito de partículas */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#321e32] via-[#ff6e00] to-[#321e32] animate-fluid z-0" />
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="particle-field"></div> {/* Partículas animadas */}
      </div>
      
      {/* Card de Login */}
      <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-transform duration-300 hover:scale-[1.005] relative overflow-hidden animate-fadeIn z-10">
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto drop-shadow-lg animate-logoDance transition-transform duration-300"
            />
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold text-[#0f0f0f] animate-fadeIn">
                Bem-vindo à<span className="block text-[#ff6e00] text-shadow-md">Plataforma Muran</span>
              </h2>
              <p className="text-[#321e32]/80 text-lg font-medium opacity-90">
                Sua jornada começa com um login
              </p>
            </div>
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
              <div className="group relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 border-2 border-[#321e32]/20 focus:border-[#ff6e00] focus:ring-2 focus:ring-[#ff6e00]/30 rounded-xl transition-all focus:shadow-lg focus:scale-105"
                  disabled={isLoading}
                />
              </div>
              <div className="group relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 border-2 border-[#321e32]/20 focus:border-[#ff6e00] focus:ring-2 focus:ring-[#ff6e00]/30 rounded-xl transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#ff6e00] hover:bg-[#ff6e00]/90 text-white transform transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 font-bold"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Acessar Plataforma"}
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fluid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes logoDance {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
          100% { transform: translateX(0); }
        }

        .animate-fluid {
          background-size: 200% 200%;
          animation: fluid 10s infinite ease-in-out;
        }

        .animate-logoDance {
          animation: logoDance 5s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .text-shadow-md {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .particle-field {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('/path-to-your-particle-image.png');
          background-size: contain;
          background-repeat: no-repeat;
          animation: particle-animation 10s infinite linear;
        }

        @keyframes particle-animation {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(-100%) translateY(-100%); }
        }
      `}</style>
    </div>
  );
};

export default Login;
