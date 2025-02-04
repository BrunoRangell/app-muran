// ... (imports e lógica permanecem iguais)

return (
  <div className="min-h-screen flex items-center justify-center bg-[#321e32] p-4 relative overflow-hidden">
    {/* Efeito de fundo */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#321e32]/50 to-[#321e32]/30" />

    {/* Card de Login */}
    <div className="w-full max-w-md bg-[#ebebf0] rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl relative overflow-hidden animate-fadeIn border border-[#ff6e00]/10">
      <div className="absolute inset-0 rounded-2xl border-[1.5px] border-[#ebebf0]/20" />
      
      <div className="p-8 space-y-6 relative z-10">
        <div className="text-center space-y-6">
          <div className="relative inline-block animate-logoFloat">
            <div className="absolute -inset-4 bg-[#ff6e00] blur-2xl opacity-20 rounded-full" />
            <img
              src="/lovable-uploads/2638a3ab-9001-4f4e-b0df-a1a3bb8786da.png"
              alt="Muran Logo"
              className="mx-auto h-24 w-auto drop-shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#0f0f0f] tracking-tight">
              Bem-vindo(a)
            </h2>
            <p className="text-[#321e32]/80 text-sm font-medium tracking-tight">
              Faça login para acessar sua conta
            </p>
          </div>
        </div>

        {showError && (
          <Alert className="bg-[#ff6e00]/10 border border-[#ff6e00]/20 text-[#0f0f0f] backdrop-blur-sm">
            <Info className="h-5 w-5 text-[#ff6e00]" />
            <AlertDescription className="ml-2 text-sm font-medium">
              Credenciais não reconhecidas. Verifique seus dados ou contate nosso suporte.
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
                placeholder="E-mail"
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
                placeholder="Senha"
                className="pl-10 border-2 border-[#321e32]/10 focus:border-[#ff6e00]/50 focus:ring-0 rounded-xl transition-all bg-white/70 backdrop-blur-sm placeholder:text-[#321e32]/60"
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
              <span>Entrar</span>
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
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }

      .animate-fadeIn {
        animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .animate-logoFloat {
        animation: logoFloat 6s ease-in-out infinite;
      }
    `}</style>
  </div>
);
