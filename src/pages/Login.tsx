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
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] p-4 relative overflow-hidden">
      {/* Efeito de partículas sutil */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-soft-light" />
      
      {/* Gradiente dinâmico */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#321e32]/80 via-[#0f0f0f] to-[#321e32]/80 animate-fluid" />

      {/* Card de Login */}
      <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden animate-fadeIn border-2 border-[#ebebf0]/20">
        <div className="absolute inset-0 rounded-2xl border-[1.5px] border-[#ff6e00]/20" />
        
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#ff6e00] blur-2xl opacity-30 rounded-full" />
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran Logo"
                className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#0f0f0f] tracking-tighter">
                Bem-vindo à
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/80">
                  Plataforma Muran
                </span>
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium tracking-tight">
                Sua jornada começa com um login
              </p>
            </div>
          </div>

          {showError && (
            <Alert className="bg-[#321e32]/5 border border-[#ff6e00]/20 text-[#0f0f0f] backdrop-blur-sm">
              <Info className="h-5 w-5 text-[#ff6e00]" />
              <AlertDescription className="ml-2 text-sm font-medium">
                Conta não encontrada. Contate a administração.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group relative">
                <div className="absolute inset-0 bg-[#ff6e00]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-[#ff6e00]/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-colors z-10" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/50 backdrop-blur-sm"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/90 hover:from-[#ff6e00]/90 hover:to-[#ff6e00] text-white font-bold tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6e00]/20 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="drop-shadow-sm">Acessar Plataforma</span>
              )}
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

        .animate-fluid {
          background-size: 400% 400%;
          animation: fluid 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
