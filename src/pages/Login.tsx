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

  // Posições memorizadas das partículas
  const [particles] = useState(() => 
    Array.from({ length: 50 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.5,
      delay: Math.random() * 50 * 0.3
    }))
  );

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
        navigate("/");
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
      {/* Camadas de Fundo Premium */}
      <div className="absolute inset-0 z-[-1]">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#160B21] via-[#0F0819] to-[#1A0B2E]" />

        {/* Brilho radial central */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF6E00]/15 via-[#FF6E00]/05 to-transparent" />

        {/* Padrão geométrico estático */}
        <svg 
          viewBox="0 0 100 100" 
          className="absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-5"
        >
          <defs>
            <linearGradient id="geoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6E00" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF914D" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon
            points="50,0 100,50 50,100 0,50"
            fill="url(#geoGradient)"
            transform="rotate(45 50 50)"
          />
          <rect
            x="25"
            y="25"
            width="50"
            height="50"
            fill="none"
            stroke="url(#geoGradient)"
            strokeWidth="2"
            transform="rotate(10 50 50)"
          />
        </svg>

        {/* Partículas flutuantes com posições memorizadas */}
        <div className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-1000">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#ff6e00] rounded-full animate-particleFloat"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                opacity: particle.opacity
              }}
            />
          ))}
        </div>

        {/* Textura de pontos sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgxNnYxNkgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-10" />
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-[rgba(235,235,240,0.95)] rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-3xl relative overflow-hidden border border-[rgba(255,255,255,0.1)] group hover:border-[#ff6e00]/20">
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
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
        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-60px) scale(0.8); }
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

        .animate-particleFloat {
          animation: particleFloat 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
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
