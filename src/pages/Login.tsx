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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setShowError(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setShowError(true);
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f15] p-4 relative overflow-hidden isolate">
      {/* Efeito de fundo geométrico animado */}
      <div className="absolute inset-0 opacity-20 z-[-1]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')] animate-textureMove" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff6e00]/10 to-transparent" />
      </div>

      {/* Efeito de partículas suaves */}
      <div className="absolute inset-0 opacity-30 z-[-1] pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#ff6e00] rounded-full animate-particleFloat"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      {/* Card de Login com efeito de vidro */}
      <div className="w-full max-w-md bg-[rgba(235,235,240,0.95)] rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-3xl relative overflow-hidden border border-[rgba(255,255,255,0.1)] group hover:border-[#ff6e00]/20">
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            {/* Logo com animação complexa */}
            <div className="relative inline-block animate-logoDance">
              <div className="absolute inset-0 bg-[#ff6e00] blur-2xl opacity-10 rounded-full" />
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran Logo"
                className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6e00] to-[#ff914d] tracking-tight">
                Bem-vindo(a)
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium tracking-tight">
                Faça login para acessar sua conta
              </p>
            </div>
          </div>

          {showError && (
            <Alert className="bg-[#ff6e00]/10 border border-[#ff6e00]/20 text-[#0f0f0f] backdrop-blur-sm">
              <Info className="h-5 w-5 text-[#ff6e00]" />
              <AlertDescription className="ml-2 text-sm font-medium">
                Credenciais não reconhecidas
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-sm hover:shadow-md"
                />
              </div>
              
              <div className="group relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff6e00] to-[#ff914d] text-white font-bold tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6e00]/20 active:scale-[0.98] relative overflow-hidden group"
              disabled={isLoading}
            >
              <span className="relative z-10">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </span>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:400%_400%] animate-shine" />
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes textureMove {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(0.8); }
          100% { transform: translateY(0) scale(1); }
        }

        @keyframes logoDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20% { transform: translateY(-10px) rotate(3deg) scale(1.05); }
          40% { transform: translateY(5px) rotate(-2deg) scale(0.98); }
          60% { transform: translateY(-7px) rotate(2deg) scale(1.03); }
          80% { transform: translateY(3px) rotate(-1deg) scale(0.99); }
        }

        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .animate-textureMove {
          animation: textureMove 20s linear infinite;
        }

        .animate-particleFloat {
          animation: particleFloat 8s ease-in-out infinite;
        }

        .animate-logoDance {
          animation: logoDance 6s ease-in-out infinite;
        }

        .animate-shine {
          animation: shine 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
