
import { useState, useEffect, useRef } from "react";
import { Loader, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function CompactNextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [isAutoReviewing, setIsAutoReviewing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastExecutionInfo, setLastExecutionInfo] = useState<any>(null);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const progressCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const { toast } = useToast();
  
  // O intervalo de execução é de 3 minutos (180 segundos) para testes
  const EXECUTION_INTERVAL = 3 * 60; // 3 minutos em segundos
  const PROGRESS_CHECK_INTERVAL = 30 * 1000; // Verificar progresso a cada 30 segundos

  // Função melhorada para calcular o tempo até a próxima revisão
  const updateSecondsToNext = () => {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMinutes = now.getMinutes();
    
    // Calcular o próximo minuto divisível por 3
    const nextMinutesDivisibleByThree = Math.ceil(currentMinutes / 3) * 3;
    
    // Calcular segundos até o próximo intervalo de 3 minutos
    let secondsToNextInterval;
    if (nextMinutesDivisibleByThree === currentMinutes && currentSeconds === 0) {
      // Estamos exatamente no tempo de execução, próxima será daqui a 3 minutos
      secondsToNextInterval = EXECUTION_INTERVAL;
    } else if (nextMinutesDivisibleByThree === currentMinutes) {
      // Estamos no minuto certo, mas não no segundo zero
      secondsToNextInterval = (60 - currentSeconds) + ((3 - 1) * 60);
    } else {
      // Estamos em outro minuto
      const minutesRemaining = nextMinutesDivisibleByThree - currentMinutes - 1;
      secondsToNextInterval = (60 - currentSeconds) + (minutesRemaining * 60);
    }
    
    console.log(`[CompactNextReviewCountdown] Próxima revisão em ${Math.floor(secondsToNextInterval / 60)}min ${secondsToNextInterval % 60}seg (${nextMinutesDivisibleByThree}min)`);
    
    setSecondsToNext(secondsToNextInterval);
    return secondsToNextInterval;
  };

  // Função para verificar se há revisão ativa
  const checkForActiveReview = async (forceCheck = false) => {
    // Evitar verificações muito frequentes a menos que seja forçado
    const now = Date.now();
    if (!forceCheck && now - lastCheckRef.current < 30000) {
      console.log("[CompactNextReviewCountdown] Verificação ignorada - muito frequente");
      return;
    }
    
    lastCheckRef.current = now;
    console.log("[CompactNextReviewCountdown] Verificando revisões ativas...");
    
    try {
      setIsLoading(true);
      
      // Primeiro, verificar se há revisão em andamento
      const { data: activeReview, error: activeError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (activeError) throw activeError;
      
      // Em segundo lugar, obter a última execução para informações
      const { data: lastExecution, error: lastError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .order('execution_time', { ascending: false })
        .limit(1);
        
      if (lastError) throw lastError;
      
      if (lastExecution && lastExecution.length > 0) {
        setLastExecutionInfo(lastExecution[0]);
        
        // Log detalhado para debug
        console.log("[CompactNextReviewCountdown] Última execução:", {
          execution_time: lastExecution[0].execution_time,
          status: lastExecution[0].status,
          details: lastExecution[0].details
        });
      }
      
      if (activeReview && activeReview.length > 0) {
        console.log("[CompactNextReviewCountdown] Revisão ativa encontrada:", activeReview[0]);
        setIsAutoReviewing(true);
        fetchReviewProgress();
        startProgressMonitoring();
      } else {
        console.log("[CompactNextReviewCountdown] Nenhuma revisão em andamento encontrada");
        setIsAutoReviewing(false);
        
        // Se houver uma execução completada recentemente (menos de 5 minutos), mantenha o progresso
        if (lastExecution && lastExecution.length > 0 && 
            (lastExecution[0].status === 'success' || lastExecution[0].status === 'completed') && 
            new Date(lastExecution[0].execution_time).getTime() > now - 5 * 60 * 1000) {
          console.log("[CompactNextReviewCountdown] Execução recente encontrada, mantendo progresso");
          // Não resetamos o progresso para mostrar o resultado da última execução por um tempo
        } else {
          setProgress(0);
          stopProgressMonitoring();
        }
      }
    } catch (error) {
      console.error("Erro ao verificar revisão ativa:", error);
      toast({
        title: "Erro ao verificar revisões",
        description: "Não foi possível verificar se há revisões em andamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      console.log("[CompactNextReviewCountdown] Buscando progresso da revisão...");
      
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
        console.log(`[CompactNextReviewCountdown] Progresso: ${progressValue.toFixed(1)}% (${uniqueProcessed.length}/${clients.length})`);
        setProgress(progressValue);
        
        if (progressValue >= 100) {
          console.log("[CompactNextReviewCountdown] Revisão concluída (100%)");
          
          // Verificar se o status na tabela já foi atualizado
          const { data: activeReview } = await supabase
            .from('cron_execution_logs')
            .select('*')
            .eq('job_name', 'daily-meta-review-job')
            .eq('status', 'started')
            .order('execution_time', { ascending: false })
            .limit(1);
          
          if (activeReview && activeReview.length > 0) {
            console.log("[CompactNextReviewCountdown] Atualizando status da revisão para completed");
            // Se a revisão ainda estiver marcada como 'started' mas o progresso é 100%, atualizamos
            await supabase
              .from('cron_execution_logs')
              .update({
                status: 'completed',
                details: {
                  ...activeReview[0].details,
                  completedAt: new Date().toISOString(),
                  progressMarkedComplete: true
                }
              })
              .eq('id', activeReview[0].id);
          }
          
          setIsAutoReviewing(false);
          stopProgressMonitoring();
          
          toast({
            title: "Revisão automática concluída",
            description: "Todos os clientes foram processados com sucesso.",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar progresso da revisão:", error);
    }
  };

  // Função para iniciar manualmente uma revisão
  const triggerManualReview = async () => {
    try {
      setIsLoading(true);
      console.log("[CompactNextReviewCountdown] Iniciando revisão manual...");
      
      // Verificar se já existe uma revisão em andamento
      const { data: activeReview } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (activeReview && activeReview.length > 0) {
        console.log("[CompactNextReviewCountdown] Já existe uma revisão em andamento");
        toast({
          title: "Revisão já em andamento",
          description: "Aguarde a conclusão da revisão atual.",
        });
        setIsAutoReviewing(true);
        fetchReviewProgress();
        startProgressMonitoring();
        return;
      }
      
      // Criar registro na tabela de logs
      const { data: logEntry, error: logError } = await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            source: 'manual_trigger',
            timestamp: new Date().toISOString(),
            triggered_from: 'compact_countdown'
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Chamar a função edge
      const { error: edgeError } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: {
            executeReview: true,
            manual: true,
            logId: logEntry.id,
            timestamp: new Date().toISOString()
          }
        }
      );
      
      if (edgeError) throw edgeError;
      
      console.log("[CompactNextReviewCountdown] Revisão manual iniciada com sucesso");
      toast({
        title: "Revisão iniciada",
        description: "A revisão automática foi iniciada manualmente.",
      });
      
      // Atualizar estado
      setIsAutoReviewing(true);
      fetchReviewProgress();
      startProgressMonitoring();
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      toast({
        title: "Erro ao iniciar revisão",
        description: "Não foi possível iniciar a revisão automática.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para configurar temporizadores e verificar estado inicial
  useEffect(() => {
    console.log("[CompactNextReviewCountdown] Componente montado - inicializando");
    
    // Inicializar o contador
    updateSecondsToNext();
    
    // Verificar revisões ativas
    checkForActiveReview(true);
    
    // Limpar contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Configurar novo contador
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prevSeconds => {
        if (prevSeconds <= 1) {
          console.log("[CompactNextReviewCountdown] Contador zerou - verificando revisões");
          const nextSeconds = updateSecondsToNext();
          checkForActiveReview(true); // Verificar quando o contador chegar a zero
          
          // Aqui tentamos iniciar uma revisão automaticamente quando o contador chega a zero
          triggerCronEventIfNeeded();
          
          return nextSeconds;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    
    // Verificação periódica adicional
    const periodicCheckInterval = setInterval(() => {
      console.log("[CompactNextReviewCountdown] Verificação periódica programada");
      checkForActiveReview();
    }, 60 * 1000); // Verificar a cada minuto
    
    return () => {
      console.log("[CompactNextReviewCountdown] Componente desmontado - limpando");
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
      clearInterval(periodicCheckInterval);
    };
  }, []); // Sem dependências - executar apenas uma vez
  
  // Função para verificar se devemos tentar iniciar uma execução do cron
  const triggerCronEventIfNeeded = async () => {
    try {
      // Verificar quando foi a última execução
      const now = new Date();
      const { data: lastExecution } = await supabase
        .from('cron_execution_logs')
        .select('execution_time, status')
        .eq('job_name', 'daily-meta-review-job')
        .order('execution_time', { ascending: false })
        .limit(1);
        
      if (!lastExecution || lastExecution.length === 0) {
        // Se não há execuções anteriores, podemos iniciar
        triggerManualReview();
        return;
      }
      
      const lastExecutionTime = new Date(lastExecution[0].execution_time);
      const diffMinutes = (now.getTime() - lastExecutionTime.getTime()) / (1000 * 60);
      
      console.log(`[CompactNextReviewCountdown] Última execução há ${diffMinutes.toFixed(1)} minutos, status: ${lastExecution[0].status}`);
      
      // Se a última execução foi há mais de 2 minutos, podemos iniciar uma nova
      // Esta lógica simula o comportamento do cron se ele não estiver funcionando
      if (diffMinutes > 2) {
        console.log("[CompactNextReviewCountdown] Última execução foi há mais de 2 minutos, iniciando nova revisão");
        triggerManualReview();
      } else {
        console.log("[CompactNextReviewCountdown] Última execução muito recente, aguardando");
      }
      
    } catch (error) {
      console.error("Erro ao verificar última execução do cron:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="text-sm">
      {isAutoReviewing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5">
              <Loader className="h-3.5 w-3.5 text-[#ff6e00] animate-spin" />
              <span className="text-gray-600 text-xs">Revisão em progresso</span>
            </div>
            <span className="font-semibold text-xs">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-1 bg-gray-100" 
            indicatorClassName="bg-[#ff6e00]" 
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-xs text-gray-500">Próxima revisão:</span>
            <span className="font-mono text-xs font-medium">{formatTime(secondsToNext)}</span>
          </div>
          
          <button 
            onClick={triggerManualReview} 
            disabled={isLoading}
            className="flex items-center justify-center gap-1 text-xs py-1 px-2 rounded bg-[#ff6e00] hover:bg-[#e66300] text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Testar Agora
          </button>
          
          {lastExecutionInfo && (
            <div className="text-[10px] text-gray-500 mt-1">
              Última execução: {new Date(lastExecutionInfo.execution_time).toLocaleTimeString()} - 
              {" "}{lastExecutionInfo.status === "success" || lastExecutionInfo.status === "completed" 
                ? <span className="text-green-600">Sucesso</span> 
                : lastExecutionInfo.status === "started" 
                  ? <span className="text-orange-500">Em andamento</span>
                  : <span className="text-red-500">Falha</span>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
