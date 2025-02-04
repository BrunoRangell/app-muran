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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.dynamic-shadow');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ... (mantenha validateForm e handleLogin iguais)

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

      <style jsx global>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes logoFloat {
          0% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(-1deg); }
        }

        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100vh) scale(0); opacity: 0; }
        }

        @keyframes glow {
          0% { opacity: 0.3; }
          50% { opacity: 0.1; }
          100% { opacity: 0.3; }
        }

        @keyframes textFlicker {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.9; transform: translateY(-1px); }
        }

        @keyframes formEnter {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes softPulse {
          0% { transform: scale(0.995); opacity: 0.9; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.995); opacity: 0.9; }
        }

        .animate-particle {
          animation: particle 8s linear infinite;
        }

        .animate-glow {
          animation: glow 4s ease-in-out infinite;
        }

        .animate-textFlicker {
          animation: textFlicker 3s ease-in-out infinite;
        }

        .animate-formEnter {
          animation: formEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .animate-softPulse {
          animation: softPulse 2s ease-in-out infinite;
        }

        .shadow-inset {
          box-shadow: inset 0 2px 4px rgba(15, 15, 15, 0.05);
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(255, 110, 0, 0.2);
        }

        .dynamic-shadow {
          position: relative;
          transition: transform 0.3s ease-out;
        }

        .dynamic-shadow:hover {
          transform: perspective(1000px) rotateX(3deg) rotateY(3deg) scale(1.01);
        }
      `}</style>
    </div>
  );
};

export default Login;
