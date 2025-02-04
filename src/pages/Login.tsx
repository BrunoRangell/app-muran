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
    setIsLoading(true);
    setShowError(false);

    try {
      console.log("Iniciando tentativa de login com email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro no login:", error);
        setShowError(true);
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log("Login bem sucedido para o usuário:", email);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro durante o login:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-muran-primary animate-gradient-x p-4 relative overflow-hidden">
      {/* Efeito de partículas animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full animate-float"
            style={{
              width: Math.random() * 20 + 10 + 'px',
              height: Math.random() * 20 + 10 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden">
        {/* Efeito de borda animada */}
        <div className="absolute inset-0 animate-border-rotate rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-muran-primary opacity-20" />
        </div>

        <div className="p-8 space-y-6 relative">
          {/* Header com animação */}
          <div className="text-center space-y-4 animate-slide-in">
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto filter drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-muran-primary bg-clip-text text-transparent">
                Bem-vindo(a) de volta
              </h2>
              <p className="text-gray-600 text-sm font-medium">
                Sua jornada começa aqui
              </p>
            </div>
          </div>

          {/* Alert com animação */}
          {showError && (
            <Alert className="bg-orange-50 border-orange-200 text-orange-800 animate-shake">
              <Info className="h-5 w-5" />
              <AlertDescription className="ml-2 text-sm">
                Conta não encontrada. Entre em contato com a administração.
              </AlertDescription>
            </Alert>
          )}

          {/* Formulário com efeitos de foco */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-muran-primary/10 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    <span className="bg-white px-1">Email</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 border-2 group-focus-within:border-purple-500 transition-all duration-300"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-muran-primary/10 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    <span className="bg-white px-1">Senha</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-muran-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 border-2 group-focus-within:border-muran-primary transition-all duration-300"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botão com efeito brilhante */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-muran-primary hover:from-purple-700 hover:to-muran-primary/90 text-white 
                        transform transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Entrar</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer com gradiente animado */}
        <div className="bg-gradient-to-r from-purple-600/10 to-muran-primary/10 p-4 text-center border-t border-white/20">
          <p className="text-sm text-gray-600 font-medium">
            Precisa de ajuda?{' '}
            <a href="#" className="text-muran-primary hover:text-purple-600 transition-colors font-semibold relative group">
              <span className="relative z-10">Contate a administração</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-muran-primary group-hover:bg-purple-600 transition-colors duration-300" />
            </a>
          </p>
        </div>
      </div>

      {/* Adicionar estas animações no CSS global */}
      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes border-rotate {
          100% { transform: rotate(360deg); }
        }
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 15s ease infinite;
        }
        .animate-float {
          animation: float 10s infinite ease-in-out;
        }
        .animate-border-rotate {
          animation: border-rotate 20s linear infinite;
          mask: 
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          padding: 2px;
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        @keyframes slide-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;