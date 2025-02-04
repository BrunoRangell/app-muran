import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Mail, Key, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  // ... (mantenha todos os estados e funções exatamente como estão)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f15] p-4 relative overflow-hidden isolate">
      {/* Novo Fundo - Constelação Dinâmica */}
      <div className="absolute inset-0 z-[-1]">
        {/* Base sólida mantendo a cor atual */}
        <div className="absolute inset-0 bg-[#0f0f15]" />

        {/* Estrelas estáticas */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Estrelas pequenas (0.5px) */}
          {[...Array(120)].map((_, i) => (
            <div
              key={`small-${i}`}
              className="absolute w-[0.5px] h-[0.5px] bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}

          {/* Estrelas médias (1px) */}
          {[...Array(60)].map((_, i) => (
            <div
              key={`medium-${i}`}
              className="absolute w-px h-px bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}

          {/* Estrelas grandes (2px) */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`large-${i}`}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.9 + 0.1
              }}
            />
          ))}
        </div>

        {/* Linhas conectores geométricos */}
        <svg 
          viewBox="0 0 100 100" 
          className="absolute w-full h-full"
          preserveAspectRatio="none"
        >
          {[...Array(50)].map((_, i) => {
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = x1 + (Math.random() * 10 - 5);
            const y2 = y1 + (Math.random() * 10 - 5);
            const x3 = x2 + (Math.random() * 10 - 5);
            const y3 = y2 + (Math.random() * 10 - 5);

            return (
              <g key={`triangle-${i}`}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.3"
                />
                <line
                  x1={`${x2}%`}
                  y1={`${y2}%`}
                  x2={`${x3}%`}
                  y2={`${y3}%`}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.3"
                />
                <line
                  x1={`${x3}%`}
                  y1={`${y3}%`}
                  x2={`${x1}%`}
                  y2={`${y1}%`}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.3"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Card de Login (mantido idêntico) */}
      <div className="w-full max-w-md bg-[rgba(235,235,240,0.95)] rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-3xl relative overflow-hidden border border-[rgba(255,255,255,0.1)] group hover:border-[#ff6e00]/20">
        {/* ... (mantenha todo o conteúdo do card exatamente igual) */}
      </div>

      <style jsx global>{`
        /* Mantenha as animações existentes do logo e shine */
        @keyframes logoDance {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20% { transform: translateY(-10px) rotate(3deg) scale(1.05); }
          40% { transform: translateY(5px) rotate(-2deg) scale(0.98); }
          60% { transform: translateY(-7px) rotate(2deg) scale(1.03); }
          80% { transform: translateY(3px) rotate(-1deg) scale(0.99); }
        }

        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .animate-logoDance {
          animation: logoDance 6s ease-in-out infinite;
        }

        .animate-shine {
          animation: shine 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
