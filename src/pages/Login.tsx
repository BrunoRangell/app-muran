import { useState, useEffect } from "react";
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
  const [logoAnimation, setLogoAnimation] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoAnimation(true);
      setTimeout(() => setLogoAnimation(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

      toast({ title: "Login realizado com sucesso!", description: "Bem-vindo(a) de volta!" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden text-white">
      {/* Fundo animado dinâmico */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#321e32] via-[#ff6e00] to-[#321e32] animate-fluid opacity-70" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Card de Login */}
      <div className="w-full max-w-md bg-[#1c1c1e] rounded-2xl shadow-2xl transform transition-transform duration-300 hover:scale-[1.005] relative overflow-hidden border border-[#ff6e00]/50 p-8 space-y-6">
        <div className="text-center space-y-6">
          <img
            src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
            alt="Muran Logo"
            className={`mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-700 ${logoAnimation ? 'rotate-[3deg] scale-105' : ''}`}
          />
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-white drop-shadow-md">
              Bem-vindo à <span className="block text-[#ff6e00]">Plataforma Muran</span>
            </h2>
            <p className="text-[#cccccc] text-sm font-medium">Sua jornada começa com um login</p>
          </div>
        </div>

        {showError && (
          <Alert className="bg-[#ff6e00]/10 border-[#ff6e00]/30 text-white animate-shake">
            <Info className="h-5 w-5 text-[#ff6e00]" />
            <AlertDescription className="ml-2 text-sm">
              Conta não encontrada. Contate a administração.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#cccccc]" />
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10 bg-[#2c2c2e] border-2 border-[#ff6e00]/50 rounded-xl text-white" disabled={isLoading} />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-[#cccccc]" />
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 bg-[#2c2c2e] border-2 border-[#ff6e00]/50 rounded-xl text-white" disabled={isLoading} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-[#ff6e00] text-white font-bold hover:bg-[#ff6e00]/90 transform transition-all duration-300 hover:scale-[1.02] active:scale-95" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Acessar Plataforma"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
