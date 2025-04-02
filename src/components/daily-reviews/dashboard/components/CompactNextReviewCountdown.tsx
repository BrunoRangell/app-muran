
import { useState, useEffect, useRef } from "react";
import { Clock, Loader } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { AnalysisProgress } from "./AnalysisProgress";

export function CompactNextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [isAutoReviewing, setIsAutoReviewing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [processedClients, setProcessedClients] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProcessedTime, setLastProcessedTime] = useState<Date | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // O intervalo de execução é de 5 horas (18000 segundos)
  const EXECUTION_INTERVAL = 5 * 60 * 60; // 5 horas em segundos
  const PROGRESS_CHECK_INTERVAL = 60000; // Verificar progresso a cada 1 minuto em vez de 3 segundos

  const updateSecondsToNext = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const currentTotalSeconds = hours * 3600 + minutes * 60 + seconds;
    const nextFiveHourMark = Math.ceil(currentTotalSeconds / EXECUTION_INTERVAL) * EXECUTION_INTERVAL;
    
    const secondsUntilNext = nextFiveHourMark - currentTotalSeconds;
    setSecondsToNext(secondsUntilNext === 0 ? EXECUTION_INTERVAL : secondsUntilNext);
  };

  const checkForActiveReview = async () => {
    try {
      console.log("[CompactNextReviewCountdown] Verificando revisão ativa...");
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("[CompactNextReviewCountdown] Erro ao buscar logs de execução:", error);
        setErrorMessage(`Erro ao verificar revisão ativa: ${error.message}`);
        return;
      }
      
      if (data && data.length > 0) {
        console.log("[CompactNextReviewCountdown] Encontrada revisão em andamento:", data[0]);
        setIsAutoReviewing(true);
        fetchReviewProgress();
        startProgressMonitoring();
      } else {
        console.log("[CompactNextReviewCountdown] Nenhuma revisão em andamento encontrada");
        setIsAutoReviewing(false);
        setProgress(0);
        setProcessedClients(0);
        stopProgressMonitoring();
      }
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao verificar revisão ativa:", error);
      setErrorMessage(`Erro ao verificar revisão: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const startProgressMonitoring = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      fetchReviewProgress();
    }, PROGRESS_CHECK_INTERVAL);
  };

  const stopProgressMonitoring = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const fetchReviewProgress = async () => {
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, meta_account_id')
        .eq('status', 'active')
        .not('meta_account_id', 'is', null)
        .not('meta_account_id', 'eq', '');
      
      if (clientsError) {
        console.error("[CompactNextReviewCountdown] Erro ao buscar clientes:", clientsError);
        return;
      }
      
      if (clients && clients.length > 0) {
        setTotalClients(clients.length);
        console.log(`[CompactNextReviewCountdown] Total de clientes para processar: ${clients.length}`);
        
        const today = new Date().toISOString().split('T')[0];
        const { data: processed, error: reviewsError } = await supabase
          .from('daily_budget_reviews')
          .select('client_id, created_at')
          .eq('review_date', today)
          .order('created_at', { ascending: false });
        
        if (reviewsError) {
          console.error("[CompactNextReviewCountdown] Erro ao buscar revisões:", reviewsError);
          return;
        }
        
        if (processed) {
          const clientIds = clients.map(c => c.id);
          const uniqueProcessed = [...new Set(processed.map(p => p.client_id))];
          
          const numProcessedClients = uniqueProcessed.filter(id => clientIds.includes(id)).length;
          setProcessedClients(numProcessedClients);
          
          console.log(`[CompactNextReviewCountdown] Clientes processados hoje: ${numProcessedClients} de ${clients.length}`);
          
          const progressValue = clients.length > 0 ? (numProcessedClients / clients.length) * 100 : 0;
          setProgress(progressValue);
          
          if (processed.length > 0) {
            setLastProcessedTime(new Date());
          }
          
          if (progressValue >= 100) {
            console.log("[CompactNextReviewCountdown] Todos os clientes foram processados!");
            setTimeout(() => {
              setIsAutoReviewing(false);
              stopProgressMonitoring();
              
              queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
              
              try {
                supabase
                  .from('cron_execution_logs')
                  .update({ status: 'success' })
                  .eq('job_name', 'daily-meta-review-job')
                  .eq('status', 'started')
                  .then(() => {
                    console.log("[CompactNextReviewCountdown] Log de execução atualizado para 'success'");
                  });
              } catch (updateError) {
                console.error("[CompactNextReviewCountdown] Erro ao atualizar status do log:", updateError);
              }
              
              updateLastBatchReviewTime();
              
              toast({
                title: "Revisão automática concluída",
                description: `${numProcessedClients} clientes foram analisados com sucesso.`,
              });
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao buscar progresso da revisão:", error);
      setErrorMessage(`Erro ao verificar progresso: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const updateLastBatchReviewTime = async () => {
    try {
      const now = new Date().toISOString();
      
      await supabase.from('system_logs').insert({
        event_type: 'batch_review_completed',
        message: `Revisão em lote concluída automaticamente`,
        details: { timestamp: now }
      });
      
      console.log("[CompactNextReviewCountdown] Data da última revisão em massa atualizada:", now);
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao atualizar data da última revisão em massa:", error);
    }
  };

  useEffect(() => {
    updateSecondsToNext();
    checkForActiveReview();
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Modificado para APENAS atualizar o contador visível, sem iniciar revisão
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prev => {
        if (prev <= 1) {
          // APENAS atualiza o contador sem iniciar revisão
          updateSecondsToNext();
          return EXECUTION_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Incluir horas no formato já que estamos trabalhando com 5 horas
    if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isAutoReviewing) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
        <Clock className="h-3 w-3 text-[#ff6e00]" />
        <span>Próxima revisão em</span>
        <span className="font-mono font-medium">{formatTime(secondsToNext)}</span>
      </div>
    );
  }

  const progressPercentage = Math.round(progress);

  return (
    <div className="space-y-1.5 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-100">
      <AnalysisProgress
        isBatchAnalyzing={true}
        batchProgress={processedClients}
        totalClientsToAnalyze={totalClients}
        progressPercentage={progressPercentage}
      />
      {errorMessage && (
        <div className="text-xs text-amber-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
