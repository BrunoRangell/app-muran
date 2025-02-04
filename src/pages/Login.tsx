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
    console.log("Iniciando processo de login...");
    
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
        console.error("Erro no login:", error.message);
        setShowError(true);
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente",
          variant: "destructive",
        });
      } else {
        console.log("Login realizado com sucesso");
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-[#321e32] p-4 relative overflow-hidden isolate">
      {/* Efeito de partículas animadas */}
      <div className="absolute inset-0 opacity-30 z-[-1]">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#ff6e00] rounded-full animate-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* Efeito de luz dinâmica */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute h-[500px] w-[500px] bg-[radial-gradient(#ff6e00_0%,transparent_70%)] opacity-10 blur-3xl animate-glow rotate-180" />
      </div>

      {/* Card de Login com efeito 3D */}
      <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden animate-fadeIn border border-[#ff6e00]/10 dynamic-shadow group">
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),#ff6e0020_0%,transparent_100%)]" />
        
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <div className="relative inline-block animate-logoFloat">
              <div className="absolute -inset-4 bg-[#ff6e00] blur-2xl opacity-20 rounded-full animate-pulse" />
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran Logo"
                className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105 hover:rotate-[2deg] cursor-grab active:cursor-grabbing"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotate(2deg) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                }}
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#0f0f0f] tracking-tight animate-textFlicker">
                Bem-vindo(a)
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium tracking-tight animate-fadeInUp">
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
            <div className="space-y-5 animate-formEnter">
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
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-inset hover:shadow-glow"
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
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60 shadow-inset hover:shadow-glow"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/90 hover:from-[#ff6e00]/90 hover:to-[#ff6e00] text-white font-bold tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6e00]/20 active:scale-[0.98] relative overflow-hidden"
              disabled={isLoading}
            >
              <span className="relative z-10">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Entrar"
                )}
              </span>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fff2_0%,transparent_70%)] opacity-0 hover:opacity-100 transition-opacity" />
            </Button>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .animate-float {
            animation: float 8s infinite ease-in-out;
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%, 90% { transform: translateX(-1px); }
            20%, 80% { transform: translateX(2px); }
            30%, 50%, 70% { transform: translateX(-3px); }
            40%, 60% { transform: translateX(3px); }
          }
        `}
      </style>
    </div>
  );
};

export default Login;