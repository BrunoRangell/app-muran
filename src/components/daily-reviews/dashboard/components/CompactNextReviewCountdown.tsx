
import { useState, useEffect, useRef } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CompactNextReviewCountdownProps {
  onAnalyzeAll: () => Promise<void>;
}

export function CompactNextReviewCountdown({ onAnalyzeAll }: CompactNextReviewCountdownProps) {
  const [secondsToNext, setSecondsToNext] = useState<number>(180); // 3 minutos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para atualizar o contador
  const updateCountdown = () => {
    console.log("[AutoReview] Contador atualizado:", secondsToNext - 1);
    setSecondsToNext(prev => {
      if (prev <= 1) {
        console.log("[AutoReview] Contador chegou a zero! Executando revisão automática...");
        // Quando o contador chegar a zero, executar a revisão automaticamente
        runAutomaticReview();
        return 180; // Reinicia para 3 minutos
      }
      return prev - 1;
    });
  };

  // Função para executar a revisão automaticamente
  const runAutomaticReview = async () => {
    if (isRunning) {
      console.log("[AutoReview] Já existe uma revisão em andamento, ignorando execução automática");
      return;
    }
    
    try {
      console.log("[AutoReview] Executando revisão automática programada");
      setIsRunning(true);
      
      // Executar a função onAnalyzeAll passada como prop
      console.log("[AutoReview] Chamando função onAnalyzeAll");
      await onAnalyzeAll();
      console.log("[AutoReview] Função onAnalyzeAll concluída");
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      console.log("[AutoReview] Revisão concluída em:", now.toISOString());
      
      // Forçar atualização dos dados após a conclusão
      setTimeout(() => {
        console.log("[AutoReview] Invalidando queries para atualização de dados");
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-info"] });
      }, 5000); // Esperar 5 segundos para garantir que o processamento em segundo plano tenha avançado
      
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
      console.log("[AutoReview] Estado de execução resetado para false");
    }
  };

  // Executar manualmente a revisão
  const handleManualRun = async () => {
    if (isRunning) {
      console.log("[AutoReview] Já existe uma revisão em andamento, ignorando execução manual");
      return;
    }
    
    try {
      console.log("[AutoReview] Executando revisão manual");
      setIsRunning(true);
      
      // Executar a mesma função que é chamada quando o contador chega a zero
      console.log("[AutoReview] Chamando função onAnalyzeAll manualmente");
      await onAnalyzeAll();
      console.log("[AutoReview] Função onAnalyzeAll concluída após chamada manual");
      
      // Registrar o horário da última execução
      const now = new Date();
      setLastRunTime(now);
      console.log("[AutoReview] Revisão manual concluída em:", now.toISOString());
      
      // Reiniciar o contador
      setSecondsToNext(180);
      console.log("[AutoReview] Contador reiniciado para 180 segundos");
      
      // Forçar atualização dos dados após a conclusão
      setTimeout(() => {
        console.log("[AutoReview] Invalidando queries para atualização de dados após execução manual");
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-info"] });
      }, 5000); // Esperar 5 segundos para garantir que o processamento em segundo plano tenha avançado
      
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
      console.log("[AutoReview] Estado de execução manual resetado para false");
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
    console.log("[AutoReview] Configurando intervalo de atualização a cada 1 segundo");
    intervalRef.current = setInterval(updateCountdown, 1000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      if (intervalRef.current) {
        console.log("[AutoReview] Limpando intervalo ao desmontar componente");
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

