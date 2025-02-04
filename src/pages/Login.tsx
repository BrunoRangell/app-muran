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
    <div className="min-h-screen flex items-center justify-center bg-[#321e32] p-4 relative overflow-hidden">
      {/* Efeito de partículas na identidade visual */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              width: Math.random() * 20 + 10 + 'px',
              height: Math.random() * 20 + 10 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              background: `radial-gradient(circle, #ff6e00 ${Math.random()*50}%, #321e32 100%)`,
              opacity: 0.3
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-transform duration-300 hover:scale-[1.005] relative overflow-hidden">
        {/* Destaque laranja */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#ff6e00]/10 blur-[100px] rounded-full" />
        
        <div className="p-8 space-y-6 relative z-10">
          {/* Header impactante */}
          <div className="text-center space-y-6">
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto drop-shadow-lg hover:rotate-[5deg] transition-transform duration-300"
            />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#0f0f0f]">
                Bem-vindo à<span className="block text-[#ff6e00]">Plataforma Muran</span>
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium">
                Sua jornada começa com um login
              </p>
            </div>
          </div>

          {/* Alert personalizado */}
          {showError && (
            <Alert className="bg-[#ff6e00]/10 border-[#ff6e00]/30 text-[#0f0f0f] animate-shake">
              <Info className="h-5 w-5 text-[#ff6e00]" />
              <AlertDescription className="ml-2 text-sm">
                Conta não encontrada. Contate a administração.
              </AlertDescription>
            </Alert>
          )}

          {/* Formulário premium */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              {/* Campo Email */}
              <div className="group">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 border-2 border-[#321e32]/20 focus:border-[#ff6e00] focus:ring-2 focus:ring-[#ff6e00]/30 rounded-xl transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="group">
                <div className="relative">
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
            </div>

            {/* Botão com efeito premium */}
            <Button
              type="submit"
              className="w-full bg-[#ff6e00] hover:bg-[#ff6e00]/90 text-white 
                        transform transition-all duration-300 hover:shadow-lg
                        relative overflow-hidden border-2 border-[#ff6e00]/30
                        hover:scale-[1.02] active:scale-95 font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Acessar Plataforma</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer estilizado */}
        <div className="bg-[#321e32]/10 p-4 text-center border-t border-[#321e32]/10">
          <p className="text-sm text-[#321e32]/80">
            Precisa de ajuda?{' '}
            <a href="#" className="text-[#ff6e00] hover:text-[#321e32] font-semibold transition-colors">
              Suporte Muran
            </a>
          </p>
        </div>
      </div>

      {/* Animações CSS personalizadas */}
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