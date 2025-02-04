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
      // Lógica de autenticação real aqui
    } catch (error) {
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // SVG para textura de fundo embutido
  const backgroundTexture = () => (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" viewBox="0 0 100 100">
      <pattern id="texture" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 0h10v10H0z" fill="none"/>
        <path d="M-2 2l4-4M0 10L10 0M8 12l4-4" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#texture)"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Textura de fundo embutida */}
      {backgroundTexture()}

      {/* Card de Login */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl relative overflow-hidden border border-gray-200/60">
        <div className="p-8 space-y-6">
          {/* Logo local - Substitua pelo seu arquivo */}
          <div className="text-center">
            <div className="inline-block p-4 rounded-2xl bg-primary/10">
              <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900">Bem-vindo(a)</h2>
            <p className="text-gray-600 text-sm">Faça login para acessar sua conta</p>
          </div>

          {showError && (
            <Alert className="bg-red-50 border border-red-100 text-red-800">
              <Info className="h-4 w-4 text-red-600" />
              <AlertDescription className="ml-2 text-sm">
                Credenciais inválidas. Tente novamente.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-10 border-gray-300 focus:ring-primary/50"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="pl-10 border-gray-300 focus:ring-primary/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
