
import { useState, useEffect, useRef } from "react";
import { Clock, Loader } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export function CompactNextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [isAutoReviewing, setIsAutoReviewing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // O intervalo de execução é de 5 minutos (300 segundos)
  const EXECUTION_INTERVAL = 300;

  // Atualizar os segundos para a próxima execução
  const updateSecondsToNext = () => {
    const now = new Date();
    // Calcular o tempo restante para o próximo múltiplo de 5 minutos
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const currentTotalSeconds = minutes * 60 + seconds;
    const nextFiveMinMark = Math.ceil(currentTotalSeconds / EXECUTION_INTERVAL) * EXECUTION_INTERVAL;
    
    const secondsUntilNext = nextFiveMinMark - currentTotalSeconds;
    setSecondsToNext(secondsUntilNext === 0 ? EXECUTION_INTERVAL : secondsUntilNext);
  };

  // Verificar se há uma revisão automática em andamento
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
        // Buscar o progresso atual da revisão
        fetchReviewProgress();
        
        // Iniciar monitoramento contínuo do progresso
        startProgressMonitoring();
      } else {
        console.log("[CompactNextReviewCountdown] Nenhuma revisão em andamento encontrada");
        setIsAutoReviewing(false);
        setProgress(0);
        stopProgressMonitoring();
      }
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao verificar revisão ativa:", error);
      setErrorMessage(`Erro ao verificar revisão: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Iniciar monitoramento contínuo do progresso
  const startProgressMonitoring = () => {
    // Limpar qualquer intervalo existente
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Verificar progresso a cada 3 segundos
    progressIntervalRef.current = setInterval(() => {
      fetchReviewProgress();
    }, 3000);
  };

  // Parar monitoramento do progresso
  const stopProgressMonitoring = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Buscar o progresso da revisão em andamento
  const fetchReviewProgress = async () => {
    try {
      // Buscar todos os clientes com Meta Ads ativos
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
        
        // Buscar quantos clientes já foram processados
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
          // Eliminar duplicatas (considerar apenas a revisão mais recente por cliente)
          const clientIds = clients.map(c => c.id);
          const uniqueProcessed = [...new Set(processed.map(p => p.client_id))];
          
          // Verificar quais clientes foram processados hoje
          const processedClientIds = uniqueProcessed.filter(id => clientIds.includes(id));
          
          console.log(`[CompactNextReviewCountdown] Clientes processados hoje: ${processedClientIds.length} de ${clients.length}`);
          
          const progressValue = clients.length > 0 ? (processedClientIds.length / clients.length) * 100 : 0;
          setProgress(progressValue);
          
          // Se o progresso for 100%, a revisão terminou
          if (progressValue >= 100) {
            console.log("[CompactNextReviewCountdown] Todos os clientes foram processados!");
            setIsAutoReviewing(false);
            stopProgressMonitoring();
            
            // Recarregar os dados dos clientes
            queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
            
            // Registrar conclusão no log de execução
            try {
              await supabase
                .from('cron_execution_logs')
                .update({ status: 'success' })
                .eq('job_name', 'daily-meta-review-job')
                .eq('status', 'started');
            } catch (updateError) {
              console.error("[CompactNextReviewCountdown] Erro ao atualizar status do log:", updateError);
            }
            
            toast({
              title: "Revisão automática concluída",
              description: `${processedClientIds.length} clientes foram analisados com sucesso.`,
            });
          } else if (isAutoReviewing && progressValue > 0 && progressValue < 100) {
            // Se a revisão está em andamento e o progresso parou de avançar por um tempo
            // Verificamos a última revisão
            const latestReview = processed.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            
            if (latestReview) {
              const lastReviewTime = new Date(latestReview.created_at).getTime();
              const currentTime = new Date().getTime();
              const minutesSinceLastReview = (currentTime - lastReviewTime) / (1000 * 60);
              
              // Se passou mais de 3 minutos sem atualizações, assumimos que a revisão travou
              if (minutesSinceLastReview > 3) {
                console.log(`[CompactNextReviewCountdown] A revisão parece estar travada. Última atualização: ${minutesSinceLastReview.toFixed(1)} minutos atrás`);
                
                // Reinicia o processo para os clientes não processados
                const pendingClients = clientIds.filter(id => !processedClientIds.includes(id));
                
                if (pendingClients.length > 0) {
                  console.log(`[CompactNextReviewCountdown] Tentando retomar para ${pendingClients.length} clientes pendentes`);
                  await restartReviewForPendingClients(pendingClients);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao buscar progresso da revisão:", error);
      setErrorMessage(`Erro ao verificar progresso: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Reinicia a revisão apenas para os clientes não processados
  const restartReviewForPendingClients = async (pendingClientIds: string[]) => {
    try {
      console.log(`[CompactNextReviewCountdown] Reiniciando revisão para ${pendingClientIds.length} clientes pendentes`);
      
      // Primeiro, registre uma nova execução para os clientes pendentes
      await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            pendingClientsCount: pendingClientIds.length,
            reason: 'restart_incomplete',
            timestamp: new Date().toISOString()
          }
        });
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { 
          manual: true, 
          executeReview: true,
          pendingClientsOnly: true,
          pendingClientIds
        }
      });
      
      if (error) {
        console.error("[CompactNextReviewCountdown] Erro ao reiniciar revisão:", error);
        throw error;
      }
      
      console.log("[CompactNextReviewCountdown] Revisão para clientes pendentes iniciada:", data);
      
      toast({
        title: "Revisão retomada",
        description: `Continuando revisão para ${pendingClientIds.length} clientes pendentes`,
        variant: "default",
      });
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao reiniciar revisão:", error);
      setErrorMessage(`Erro ao reiniciar revisão: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: "Erro ao retomar revisão",
        description: `Não foi possível processar os clientes pendentes: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Executar a revisão automática
  const executeAutoReview = async () => {
    if (isAutoReviewing) {
      console.log("[CompactNextReviewCountdown] Já existe uma revisão em andamento, ignorando nova execução");
      return;
    }
    
    try {
      console.log("[CompactNextReviewCountdown] Iniciando revisão automática...");
      setIsAutoReviewing(true);
      setErrorMessage(null);
      
      // Primeiro, registre a execução no log
      const { data: logEntry, error: logError } = await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            source: 'countdown_trigger',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (logError) {
        console.error("[CompactNextReviewCountdown] Erro ao registrar execução:", logError);
      }
      
      console.log("[CompactNextReviewCountdown] Chamando função edge daily-meta-review...");
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { 
          manual: true, 
          executeReview: true,
          logId: logEntry?.id
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("[CompactNextReviewCountdown] Revisão automática iniciada:", data);
      
      toast({
        title: "Revisão automática iniciada",
        description: "O processo de revisão foi iniciado com sucesso",
        variant: "default",
      });
      
      // Iniciar verificação de progresso
      fetchReviewProgress();
      startProgressMonitoring();
      
    } catch (error) {
      console.error("[CompactNextReviewCountdown] Erro ao executar revisão automática:", error);
      
      // Atualizar o log de execução para indicar erro
      try {
        await supabase
          .from('cron_execution_logs')
          .update({
            status: 'error',
            details: {
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }
          })
          .eq('job_name', 'daily-meta-review-job')
          .eq('status', 'started');
      } catch (updateError) {
        console.error("[CompactNextReviewCountdown] Erro ao atualizar status do log:", updateError);
      }
      
      setErrorMessage(`Erro ao executar revisão: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: "Erro na revisão automática",
        description: "Não foi possível executar a revisão automática. Verifique os logs para mais detalhes.",
        variant: "destructive",
      });
      
      setIsAutoReviewing(false);
      stopProgressMonitoring();
    }
  };

  useEffect(() => {
    // Inicializar o contador
    updateSecondsToNext();
    
    // Verificar se há uma revisão em andamento
    checkForActiveReview();
    
    // Limpar qualquer contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Criar um novo contador regressivo
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prev => {
        // Se chegou a zero, reiniciar o contador e executar a revisão automática
        if (prev <= 1) {
          console.log("[CompactNextReviewCountdown] Contador chegou a zero, executando revisão automática...");
          executeAutoReview();
          updateSecondsToNext();
          return EXECUTION_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Limpeza quando o componente for desmontado
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
    };
  }, []); // Executado apenas na montagem

  // Formatar o tempo para exibição
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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

  return (
    <div className="space-y-1.5 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-100">
      <div className="flex items-center gap-1 text-xs">
        <Loader className="h-3 w-3 text-[#ff6e00] animate-spin" />
        <span className="text-gray-600">Revisão em andamento</span>
        <span className="ml-auto text-gray-500">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-1" indicatorClassName="bg-[#ff6e00]" />
      {errorMessage && (
        <div className="text-xs text-amber-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
