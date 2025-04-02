
import { useState, useEffect, useRef } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBatchReview } from "@/hooks/useBatchReview";

export function CompactNextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(180); // 3 minutos
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Usar o hook centralizado para revisão em lote
  const { reviewAllClients, isLoading, lastBatchReviewTime } = useBatchReview();

  // Função para atualizar o contador
  const updateCountdown = () => {
    setSecondsToNext(prev => {
      if (prev <= 1) {
        // Quando o contador chegar a zero, executar a revisão automaticamente
        handleExecuteReview();
        return 180; // Reinicia para 3 minutos
      }
      return prev - 1;
    });
  };

  // Função para executar a revisão
  const handleExecuteReview = async () => {
    if (isLoading) return;
    
    console.log("[CompactNextReviewCountdown] Executando revisão programada");
    
    try {
      await reviewAllClients();
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      
      // Reiniciar o contador
      setSecondsToNext(180);
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao executar revisão:", error);
    }
  };

  // Configurar o intervalo quando o componente é montado
  useEffect(() => {
    console.log("[CompactNextReviewCountdown] Inicializando contador");
    
    // Limpar qualquer intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Configurar novo intervalo
    intervalRef.current = setInterval(updateCountdown, 1000);
    
    // Usar lastBatchReviewTime para atualizar lastRunTime
    if (lastBatchReviewTime) {
      setLastRunTime(new Date(lastBatchReviewTime));
    }
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lastBatchReviewTime]);

  // Formatar o tempo para exibição
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="text-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-xs text-gray-500">Próxima revisão:</span>
          <span className="font-mono text-xs font-medium">{formatTime(secondsToNext)}</span>
        </div>
        
        <button 
          onClick={handleExecuteReview} 
          disabled={isLoading}
          className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded bg-[#ff6e00] hover:bg-[#e66300] text-white disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Executar Agora
        </button>
        
        {lastRunTime && (
          <div className="text-[10px] text-gray-500 mt-1">
            Última execução: {lastRunTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
