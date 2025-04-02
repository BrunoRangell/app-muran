import { useState, useEffect, useRef } from "react";
import { Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

export function CompactNextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [isAutoReviewing, setIsAutoReviewing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const progressCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  
  // O intervalo de execução agora é de 3 minutos (180 segundos) para testes
  const EXECUTION_INTERVAL = 3 * 60; // 3 minutos em segundos
  const PROGRESS_CHECK_INTERVAL = 60 * 1000; // Verificar progresso a cada 1 minuto

  const updateSecondsToNext = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Calcular para o próximo múltiplo de 3 minutos
    const currentTotalSeconds = minutes * 60 + seconds;
    const nextInterval = Math.ceil(currentTotalSeconds / EXECUTION_INTERVAL) * EXECUTION_INTERVAL;
    
    const secondsUntilNext = nextInterval - currentTotalSeconds;
    setSecondsToNext(secondsUntilNext === 0 ? EXECUTION_INTERVAL : secondsUntilNext);
  };

  const checkForActiveReview = async () => {
    // Evitar verificações muito frequentes
    const now = Date.now();
    if (now - lastCheckRef.current < 60000) {
      console.log("[CompactNextReviewCountdown] Verificação ignorada - muito frequente");
      return;
    }
    
    lastCheckRef.current = now;
    console.log("[CompactNextReviewCountdown] Verificando revisões ativas...");
    
    try {
      const { data } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        console.log("[CompactNextReviewCountdown] Revisão ativa encontrada");
        setIsAutoReviewing(true);
        fetchReviewProgress();
        startProgressMonitoring();
      } else {
        console.log("[CompactNextReviewCountdown] Nenhuma revisão em andamento encontrada");
        setIsAutoReviewing(false);
        setProgress(0);
        stopProgressMonitoring();
      }
    } catch (error) {
      console.error("Erro ao verificar revisão ativa:", error);
    }
  };

  const startProgressMonitoring = () => {
    // Limpar qualquer monitoramento existente
    stopProgressMonitoring();
    
    // Configurar novo monitoramento a cada minuto
    console.log("[CompactNextReviewCountdown] Iniciando monitoramento de progresso");
    progressCheckRef.current = setInterval(() => {
      fetchReviewProgress();
    }, PROGRESS_CHECK_INTERVAL);
  };

  const stopProgressMonitoring = () => {
    if (progressCheckRef.current) {
      console.log("[CompactNextReviewCountdown] Parando monitoramento de progresso");
      clearInterval(progressCheckRef.current);
      progressCheckRef.current = null;
    }
  };

  const fetchReviewProgress = async () => {
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, meta_account_id')
        .eq('status', 'active')
        .not('meta_account_id', 'is', null);
      
      const { data: processed } = await supabase
        .from('daily_budget_reviews')
        .select('client_id')
        .eq('review_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (clients && processed) {
        const uniqueProcessed = [...new Set(processed.map(p => p.client_id))];
        const progressValue = clients.length > 0 ? (uniqueProcessed.length / clients.length) * 100 : 0;
        setProgress(progressValue);
        
        if (progressValue >= 100) {
          console.log("[CompactNextReviewCountdown] Revisão concluída (100%)");
          setIsAutoReviewing(false);
          stopProgressMonitoring();
        }
      }
    } catch (error) {
      console.error("Erro ao buscar progresso da revisão:", error);
    }
  };

  useEffect(() => {
    console.log("[CompactNextReviewCountdown] Componente montado - inicializando");
    updateSecondsToNext();
    checkForActiveReview(); // Verificar apenas uma vez no carregamento
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prevSeconds => {
        if (prevSeconds <= 1) {
          updateSecondsToNext();
          return EXECUTION_INTERVAL;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    
    return () => {
      console.log("[CompactNextReviewCountdown] Componente desmontado - limpando");
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
    };
  }, []); // Sem dependências - executar apenas uma vez

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="text-sm">
      {isAutoReviewing ? (
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <Loader className="h-3.5 w-3.5 text-[#ff6e00] animate-spin" />
            <span className="text-gray-600 text-xs">Revisão em progresso</span>
          </div>
          <span className="font-semibold text-xs">{Math.round(progress)}%</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 justify-between">
          <span className="text-xs text-gray-500">Próxima revisão:</span>
          <span className="font-mono text-xs font-medium">{formatTime(secondsToNext)}</span>
        </div>
      )}
    </div>
  );
}
