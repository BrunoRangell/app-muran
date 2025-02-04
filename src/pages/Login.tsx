import React, { useState } from 'react';
import { Mail, Key, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);

    // Simulação de uma requisição de login
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Lógica de autenticação aqui
    } catch (error) {
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0f1a] p-4 relative overflow-hidden">
      {/* Efeito de partículas dinâmicas */}
      <div className="absolute inset-0 opacity-20 animate-particle-flow">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-[#ff6e00] rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`,
              transform: `scale(${0.5 + Math.random()})`
            }}
          />
        ))}
      </div>

      {/* Efeito de gradiente animado */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#ff6e00,#ff006e,#6e00ff)] bg-size-300% animate-gradient-rotate" />

      {/* Card de Login */}
      <div className="w-full max-w-md bg-[#ebebf0]/95 backdrop-blur-xl rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden animate-fadeIn border border-[#ffffff]/10 hover:border-[#ffffff]/20">
        {/* Borda animada */}
        <div className="absolute inset-0 rounded-2xl border-[3px] border-transparent animate-border-pulse pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(45deg,#ff6e00,#ff006e,#6e00ff)] bg-size-300% animate-gradient-rotate opacity-20" />
        </div>

        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <div className="relative inline-block animate-logoFloat">
              <div className="absolute -inset-4 bg-[#ff6e00] blur-2xl opacity-20 rounded-full animate-pulse-glow" />
              <img
                src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
                alt="Muran Logo"
                className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105 hover:rotate-[5deg] cursor-zoom-in"
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6e00] to-[#ff006e] tracking-tighter">
                Bem-vindo(a)
              </h2>
              <p className="text-[#321e32]/80 text-sm font-medium tracking-tight transition-colors hover:text-[#ff6e00]">
                Faça login para acessar sua conta
              </p>
            </div>
          </div>

          {showError && (
            <Alert className="bg-[#ff6e00]/10 border border-[#ff6e00]/20 text-[#0f0f0f] backdrop-blur-sm animate-enter-shake">
              <Info className="h-5 w-5 text-[#ff6e00] animate-pulse" />
              <AlertDescription className="ml-2 text-sm font-medium">
                Credenciais não reconhecidas. Verifique seus dados ou contate nosso suporte.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#ff6e0020,#ff006e10)] rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-all duration-300 group-hover:scale-110 z-10" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/90 backdrop-blur-sm placeholder:text-[#321e32]/60 hover:bg-white/100 hover:shadow-sm"
                  disabled={isLoading}
                />
              </div>
              
              <div className="group relative">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#ff6e0020,#ff006e10)] rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <Key className="absolute left-3 top-3 h-5 w-5 text-[#321e32]/50 group-focus-within:text-[#ff6e00] transition-all duration-300 group-hover:scale-110 z-10" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/90 backdrop-blur-sm placeholder:text-[#321e32]/60 hover:bg-white/100 hover:shadow-sm"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full relative overflow-hidden bg-gradient-to-r from-[#ff6e00] to-[#ff006e] hover:from-[#ff6e00]/90 hover:to-[#ff006e]/90 text-white font-bold tracking-tight transition-all duration-300 hover:shadow-xl hover:shadow-[#ff6e00]/30 active:scale-[0.98] group"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="relative z-10 drop-shadow-md">Entrar →</span>
              )}
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        @keyframes gradient-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes enter-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        @keyframes particle-flow {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-100vh) translateX(20vw); }
        }

        @keyframes border-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-logoFloat {
          animation: logoFloat 8s ease-in-out infinite;
        }

        .animate-gradient-rotate {
          animation: gradient-rotate 12s linear infinite;
        }

        .animate-enter-shake {
          animation: enter-shake 0.4s ease-in-out;
        }

        .animate-particle-flow {
          animation: particle-flow 20s linear infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-border-pulse {
          animation: border-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
