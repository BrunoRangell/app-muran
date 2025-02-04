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

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Lógica de autenticação
    } catch (error) {
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 relative overflow-hidden">
      {/* Efeito de profundidade sutil */}
      <div className="absolute inset-0 bg-[url('/subtle-texture.png')] opacity-10 mix-blend-soft-light" />

      {/* Card de Login */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all duration-500 hover:shadow-2xl relative overflow-hidden animate-fadeIn border border-neutral-200/50 hover:border-neutral-300">
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />
        
        <div className="p-8 space-y-6 relative z-10">
          <div className="text-center space-y-6">
            <div className="relative inline-block animate-logoFloat">
              <div className="absolute -inset-4 bg-primary/10 blur-xl rounded-full" />
              <img
                src="/logo.png"
                alt="Muran Logo"
                className="mx-auto h-20 w-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-neutral-800 tracking-tight">
                Bem-vindo(a)
              </h2>
              <p className="text-neutral-600 text-sm font-medium">
                Faça login para acessar sua conta
              </p>
            </div>
          </div>

          {showError && (
            <Alert className="bg-red-50 border border-red-100 text-red-800 backdrop-blur-sm animate-enter-shake">
              <Info className="h-5 w-5 text-red-600" />
              <AlertDescription className="ml-2 text-sm">
                Credenciais não reconhecidas. Verifique seus dados.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="group relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400 transition-colors duration-200 group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-10 border-2 border-neutral-200 focus:border-primary/50 focus:ring-0 rounded-xl bg-white/95 backdrop-blur-sm placeholder:text-neutral-400 hover:border-neutral-300 transition-all"
                  disabled={isLoading}
                />
              </div>
              
              <div className="group relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-neutral-400 transition-colors duration-200 group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10 border-2 border-neutral-200 focus:border-primary/50 focus:ring-0 rounded-xl bg-white/95 backdrop-blur-sm placeholder:text-neutral-400 hover:border-neutral-300 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-300 hover:shadow-md active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Entrar</span>
              )}
            </Button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes enter-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-logoFloat {
          animation: logoFloat 8s ease-in-out infinite;
        }

        .animate-enter-shake {
          animation: enter-shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
