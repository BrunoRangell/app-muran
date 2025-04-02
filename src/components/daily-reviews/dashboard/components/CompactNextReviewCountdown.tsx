
import { useState, useEffect, useRef } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompactNextReviewCountdownProps {
  onAnalyzeAll: () => Promise<void>;
}

export function CompactNextReviewCountdown({ onAnalyzeAll }: CompactNextReviewCountdownProps) {
  const [secondsToNext, setSecondsToNext] = useState<number>(180); // 3 minutos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Função para atualizar o contador
  const updateCountdown = () => {
    setSecondsToNext(prev => {
      if (prev <= 1) {
        // Quando o contador chegar a zero, executar a revisão automaticamente
        runAutomaticReview();
        return 180; // Reinicia para 3 minutos
      }
      return prev - 1;
    });
  };

  // Função para executar a revisão automaticamente
  const runAutomaticReview = async () => {
    if (isRunning) return;
    
    try {
      console.log("[AutoReview] Executando revisão automática programada");
      setIsRunning(true);
      
      // Executar a função onAnalyzeAll passada como prop
      await onAnalyzeAll();
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      
      toast({
        title: "Revisão automática iniciada",
        description: "A revisão automática foi iniciada com sucesso.",
      });
    } catch (error) {
      console.error("[AutoReview] Erro ao executar revisão automática:", error);
      toast({
        title: "Erro na revisão automática",
        description: "Ocorreu um erro ao iniciar a revisão automática.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Executar manualmente a revisão
  const handleManualRun = async () => {
    if (isRunning) return;
    
    try {
      console.log("[AutoReview] Executando revisão manual");
      setIsRunning(true);
      
      // Executar a mesma função que é chamada quando o contador chega a zero
      await onAnalyzeAll();
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      
      // Reiniciar o contador
      setSecondsToNext(180);
      
      toast({
        title: "Revisão iniciada",
        description: "A revisão foi iniciada com sucesso.",
      });
    } catch (error) {
      console.error("[AutoReview] Erro ao executar revisão manual:", error);
      toast({
        title: "Erro na revisão",
        description: "Ocorreu um erro ao iniciar a revisão.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Configurar o intervalo quando o componente é montado
  useEffect(() => {
    console.log("[AutoReview] Inicializando contador de revisão automática");
    
    // Limpar qualquer intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Configurar novo intervalo
    intervalRef.current = setInterval(updateCountdown, 1000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

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
          onClick={handleManualRun} 
          disabled={isRunning}
          className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded bg-[#ff6e00] hover:bg-[#e66300] text-white disabled:opacity-50"
        >
          {isRunning ? (
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
