
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
  
  // O intervalo de execução é de 3 minutos (180 segundos) para testes
  const EXECUTION_INTERVAL = 3 * 60; // 3 minutos em segundos
  const PROGRESS_CHECK_INTERVAL = 60 * 1000; // Verificar progresso a cada 1 minuto

  // Função aprimorada para calcular o tempo até a próxima revisão
  const updateSecondsToNext = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Calcular em relação aos múltiplos de 3 minutos dentro da hora atual
    const currentMinuteOfHour = minutes;
    const currentSecondOfMinute = seconds;
    
    // Próximo minuto divisível por 3
    const nextIntervalMinute = Math.ceil(currentMinuteOfHour / 3) * 3;
    
    if (nextIntervalMinute === currentMinuteOfHour && currentSecondOfMinute === 0) {
      // Estamos exatamente no tempo de execução
      setSecondsToNext(EXECUTION_INTERVAL);
    } else if (nextIntervalMinute === currentMinuteOfHour) {
      // Estamos no minuto correto, mas não no segundo zero
      setSecondsToNext(60 - currentSecondOfMinute + ((nextIntervalMinute + 3 - currentMinuteOfHour) * 60) - 60);
    } else {
      // Calculamos os segundos até o próximo intervalo
      const secondsUntilNextMinute = 60 - currentSecondOfMinute;
      const minutesUntilNextInterval = nextIntervalMinute - currentMinuteOfHour - 1;
      
      setSecondsToNext(secondsUntilNextMinute + (minutesUntilNextInterval * 60));
    }
    
    console.log("[CompactNextReviewCountdown] Próxima revisão em", Math.floor(secondsToNext / 60), "min", secondsToNext % 60, "seg");
  };

  // Função para verificar se há revisão ativa
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

  // Iniciar monitoramento de progresso
  const startProgressMonitoring = () => {
    stopProgressMonitoring();
    
    console.log("[CompactNextReviewCountdown] Iniciando monitoramento de progresso");
    progressCheckRef.current = setInterval(() => {
      fetchReviewProgress();
    }, PROGRESS_CHECK_INTERVAL);
  };

  // Parar monitoramento de progresso
  const stopProgressMonitoring = () => {
    if (progressCheckRef.current) {
      console.log("[CompactNextReviewCountdown] Parando monitoramento de progresso");
      clearInterval(progressCheckRef.current);
      progressCheckRef.current = null;
    }
  };

  // Verificar progresso da revisão
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

  // Efeito para configurar temporizadores
  useEffect(() => {
    console.log("[CompactNextReviewCountdown] Componente montado - inicializando");
    
    // Inicializar o contador
    updateSecondsToNext();
    
    // Verificar revisões ativas
    checkForActiveReview();
    
    // Limpar contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Configurar novo contador
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prevSeconds => {
        if (prevSeconds <= 1) {
          console.log("[CompactNextReviewCountdown] Contador zerou - verificando revisões");
          updateSecondsToNext();
          checkForActiveReview(); // Verificar quando o contador chegar a zero
          return EXECUTION_INTERVAL;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    
    // Verificação periódica adicional
    const periodicCheckInterval = setInterval(() => {
      checkForActiveReview();
    }, 3 * 60 * 1000); // Verificar a cada 3 minutos
    
    return () => {
      console.log("[CompactNextReviewCountdown] Componente desmontado - limpando");
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
      clearInterval(periodicCheckInterval);
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
