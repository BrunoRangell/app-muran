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
    <div className="min-h-screen flex items-center justify-center bg-[#1a0d1a] p-4 relative overflow-hidden isolate">
      {/* Efeitos de fundo dinâmicos */}
      <div className="absolute inset-0 z-[-2] opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(#ff6e0033_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-bgPan" />
        <div className="absolute h-[80vh] w-[80vh] bg-[radial-gradient(#ff6e00_10%,transparent_70%)] opacity-10 blur-3xl animate-glowSpin -left-1/4 -top-1/4" />
        <div className="absolute h-[80vh] w-[80vh] bg-[radial-gradient(#321e32_10%,transparent_70%)] opacity-20 blur-3xl animate-glowSpinDelayed -right-1/4 -bottom-1/4" />
      </div>

      {/* Partículas animadas */}
      <div className="absolute inset-0 opacity-30 z-[-1]">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#ff6e00] rounded-full animate-particleFloat"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              scale: `${0.5 + Math.random()}`,
            }}
          />
        ))}
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-md bg-gradient-to-br from-[#f8f8f8] to-[#ffffff] rounded-3xl shadow-2xl transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(255,110,0,0.2)] relative overflow-hidden group border-2 border-white/20 hover:border-[#ff6e00]/10 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),#ff6e0010_0%,transparent_100%)]" />
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <div className="relative inline-block animate-logoDance">
              <div className="absolute -inset-4 bg-[#ff6e00] blur-2xl opacity-20 rounded-full animate-pulse" />
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran Logo"
                className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105 cursor-grab active:cursor-grabbing"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.transform = `rotate3d(${y/50}, ${x/50}, 0, 8deg) scale(1.05)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotate3d(0, 0, 0, 0deg) scale(1)';
                }}
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-[#ff6e00] to-[#ff4500] bg-clip-text text-transparent tracking-tighter animate-textGlow">
                Bem-vindo(a)
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium tracking-tight">
                Faça login para acessar sua conta
              </p>
            </div>
          </div>

          {showError && (
            <Alert className="bg-[#ff6e00]/10 border border-[#ff6e00]/20 text-[#0f0f0f] backdrop-blur-sm animate-softPulse">
              <Info className="h-5 w-5 text-[#ff6e00] animate-bounce" />
              <AlertDescription className="ml-2 text-sm font-medium">
                Credenciais não reconhecidas
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group relative">
                <div className="absolute inset-0 bg-[#ff6e00]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/90 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-inset hover:shadow-glow"
                />
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-[#ff6e00]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/90 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-inset hover:shadow-glow"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff6e00] to-[#ff4500] hover:from-[#ff6e00]/90 hover:to-[#ff4500]/90 text-white font-bold tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6e00]/30 active:scale-[0.98] relative overflow-hidden hover:-translate-y-0.5"
              disabled={isLoading}
            >
              <span className="relative z-10">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </span>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fff3_0%,transparent_70%)] opacity-0 hover:opacity-100 transition-opacity" />
            </Button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes logoDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20% { transform: translateY(-10px) rotate(3deg) scale(1.05); }
          40% { transform: translateY(5px) rotate(-2deg) scale(0.98); }
          60% { transform: translateY(-5px) rotate(2deg) scale(1.02); }
          80% { transform: translateY(3px) rotate(-1deg) scale(0.99); }
        }
        .animate-logoDance {
          animation: logoDance 8s infinite ease-in-out;
        }

        @keyframes bgPan {
          from { background-position: 0% 0%; }
          to { background-position: 100% 100%; }
        }

        @keyframes glowSpin {
          0% { transform: rotate(0deg) scale(1); opacity: 0.1; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.15; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.1; }
        }

        @keyframes glowSpinDelayed {
          0% { transform: rotate(30deg) scale(1); opacity: 0.1; }
          50% { transform: rotate(210deg) scale(1.2); opacity: 0.15; }
          100% { transform: rotate(390deg) scale(1); opacity: 0.1; }
        }

        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(10px) translateX(-15px); }
          75% { transform: translateY(-10px) translateX(20px); }
        }

        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 110, 0, 0); }
          50% { text-shadow: 0 0 20px rgba(255, 110, 0, 0.3); }
        }
      `}</style>
    </div>
  );
};

export default Login;
