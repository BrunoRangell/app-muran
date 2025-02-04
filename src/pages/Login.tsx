// ... (imports e lógica permanecem iguais)

return (
  <div className="min-h-screen flex items-center justify-center bg-[#321e32] p-4 relative overflow-hidden">
    {/* Efeito de partículas sutis */}
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-soft-light" />

    {/* Card de Login */}
    <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden animate-fadeIn border border-[#ff6e00]/10">
      <div className="absolute inset-0 rounded-2xl border-[1.5px] border-[#ebebf0]/20" />
      
      <div className="p-8 space-y-6 relative z-10">
        <div className="text-center space-y-6">
          <div className="relative inline-block animate-logoFloat">
            <div className="absolute -inset-4 bg-[#ff6e00] blur-2xl opacity-20 rounded-full animate-pulse" />
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105 cursor-[url('/sparkle.svg'),_auto]"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#0f0f0f] tracking-tight">
              Acesso à
              <span className="block bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/90 bg-clip-text text-transparent">
                Plataforma Muran
              </span>
            </h2>
            <p className="text-[#321e32]/80 text-sm font-medium tracking-tight">
              Inscreva-se na revolução da gestão inteligente
            </p>
          </div>
        </div>

        {showError && (
          <Alert className="bg-[#ff6e00]/10 border border-gradient-to-r from-[#ff6e00]/30 to-[#321e32]/20 text-[#0f0f0f] backdrop-blur-sm animate-softPulse">
            <Info className="h-5 w-5 text-[#ff6e00]" />
            <AlertDescription className="ml-2 text-sm font-medium">
              Credenciais não reconhecidas. Por favor, verifique seus dados ou contate nosso suporte.
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
                placeholder="Digite seu e-mail corporativo"
                className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60"
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
                className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#ff6e00] to-[#ff6e00]/90 hover:from-[#ff6e00]/90 hover:to-[#ff6e00] text-white font-bold tracking-tight transition-all duration-300 hover:shadow-lg hover:shadow-[#ff6e00]/20 active:scale-[0.98] group"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Validando acesso...</span>
              </div>
            ) : (
              <span className="drop-shadow-sm group-hover:translate-y-[-1px] transition-transform">
                Acessar Dashboard
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>

    <style jsx global>{`
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      @keyframes logoFloat {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(3deg); }
        100% { transform: translateY(0) rotate(0deg); }
      }

      @keyframes softPulse {
        0% { opacity: 0.8; transform: scale(0.995); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0.8; transform: scale(0.995); }
      }

      .animate-fadeIn {
        animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .animate-logoFloat {
        animation: logoFloat 8s ease-in-out infinite;
      }

      .animate-softPulse {
        animation: softPulse 2s ease-in-out infinite;
      }
    `}</style>
  </div>
);
