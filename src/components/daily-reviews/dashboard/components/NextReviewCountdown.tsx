
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function NextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar os segundos para a próxima execução
  const updateSecondsToNext = () => {
    const now = new Date();
    const seconds = 60 - now.getSeconds();
    setSecondsToNext(seconds);
  };

  useEffect(() => {
    // Inicializar o contador
    updateSecondsToNext();
    
    // Limpar qualquer contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Criar um novo contador regressivo
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prev => {
        // Se chegou a zero, reiniciar para 60 segundos
        if (prev <= 1) {
          console.log("Contador chegou a zero, reiniciando para 60 segundos");
          return 60; // Reiniciar para 60 segundos
        }
        return prev - 1;
      });
    }, 1000);
    
    // Limpeza quando o componente for desmontado
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff6e00]" />
          <span>Próxima Revisão Automática</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-center">
          <div className="bg-gray-50 px-6 py-3 rounded-md border border-gray-200 text-center">
            <div className="text-xs text-gray-500 mb-1">Próxima execução em</div>
            <div className="font-mono font-bold text-2xl">
              {secondsToNext}s
            </div>
          </div>
        </div>
        
        <div className="pt-3 mt-3 border-t text-xs text-gray-500">
          <p>
            A revisão automática de orçamentos está configurada para executar a cada minuto. O sistema executa automaticamente sem necessidade de intervenção manual.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
