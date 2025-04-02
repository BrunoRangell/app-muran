
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function NextReviewCountdown() {
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const [isAutoReviewing, setIsAutoReviewing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [totalClients, setTotalClients] = useState<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const progressCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // O intervalo de execução é de 5 horas (18000 segundos)
  const EXECUTION_INTERVAL = 5 * 60 * 60; // 5 horas em segundos
  const PROGRESS_CHECK_INTERVAL = 60 * 1000; // Verificar progresso a cada 1 minuto

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

  // Função para verificar se há uma revisão ativa
  const checkForActiveReview = async () => {
    // Evitar verificações muito frequentes (não verificar mais de uma vez por minuto)
    const now = Date.now();
    if (now - lastCheckRef.current < 60000) {
      console.log("[NextReviewCountdown] Verificação ignorada - muito frequente");
      return;
    }
    
    lastCheckRef.current = now;
    console.log("[NextReviewCountdown] Verificando revisões ativas...");
    
    try {
      const { data } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        console.log("[NextReviewCountdown] Revisão ativa encontrada");
        setIsAutoReviewing(true);
        // Buscar o progresso atual da revisão
        fetchReviewProgress();
        startProgressMonitoring();
      } else {
        console.log("[NextReviewCountdown] Nenhuma revisão ativa encontrada");
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
    console.log("[NextReviewCountdown] Iniciando monitoramento de progresso");
    progressCheckRef.current = setInterval(() => {
      console.log("[NextReviewCountdown] Verificação periódica de progresso");
      fetchReviewProgress();
    }, PROGRESS_CHECK_INTERVAL);
  };

  const stopProgressMonitoring = () => {
    if (progressCheckRef.current) {
      console.log("[NextReviewCountdown] Parando monitoramento de progresso");
      clearInterval(progressCheckRef.current);
      progressCheckRef.current = null;
    }
  };

  const fetchReviewProgress = async () => {
    try {
      console.log("[NextReviewCountdown] Buscando progresso da revisão");
      const { data: clients } = await supabase
        .from('clients')
        .select('id, meta_account_id')
        .eq('status', 'active')
        .not('meta_account_id', 'is', null);
      
      if (clients) {
        setTotalClients(clients.length);
        
        // Buscar quantos clientes já foram processados
        const today = new Date().toISOString().split('T')[0];
        const { data: processed } = await supabase
          .from('daily_budget_reviews')
          .select('client_id')
          .eq('review_date', today)
          .order('created_at', { ascending: false });
        
        if (processed) {
          // Eliminar duplicatas (considerar apenas a revisão mais recente por cliente)
          const uniqueProcessed = [...new Set(processed.map(p => p.client_id))];
          const progressValue = clients.length > 0 ? (uniqueProcessed.length / clients.length) * 100 : 0;
          console.log(`[NextReviewCountdown] Progresso: ${progressValue.toFixed(1)}% (${uniqueProcessed.length}/${clients.length})`);
          setProgress(progressValue);
          
          // Se o progresso for 100%, a revisão terminou
          if (progressValue >= 100) {
            console.log("[NextReviewCountdown] Revisão concluída (100%)");
            setIsAutoReviewing(false);
            stopProgressMonitoring();
            
            // Recarregar os dados dos clientes
            queryClient.invalidateQueries({ queryKey: ['clients-with-reviews'] });
            
            toast({
              title: "Revisão automática concluída",
              description: `${uniqueProcessed.length} clientes foram analisados com sucesso.`,
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar progresso da revisão:", error);
    }
  };

  // Função modificada para inicialização única
  useEffect(() => {
    console.log("[NextReviewCountdown] Componente montado - inicializando");
    
    // Inicializar o contador
    updateSecondsToNext();
    
    // Verificar se há uma revisão em andamento (apenas uma vez no carregamento)
    checkForActiveReview();
    
    // Limpar qualquer contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Criar um novo contador regressivo - APENAS PARA MOSTRAR O CONTADOR, NÃO INICIA REVISÃO
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prevSeconds => {
        if (prevSeconds <= 1) {
          // Apenas reinicia o contador sem executar revisão
          updateSecondsToNext();
          return EXECUTION_INTERVAL;
        }
        return prevSeconds - 1;
      });
    }, 1000);
    
    // Limpeza quando o componente for desmontado
    return () => {
      console.log("[NextReviewCountdown] Componente desmontado - limpando");
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      stopProgressMonitoring();
    };
  }, []); // Sem dependências - executar apenas uma vez

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Incluir horas no formato
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff6e00]" />
          <span>Próxima Revisão Automática</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isAutoReviewing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Loader className="h-5 w-5 text-[#ff6e00] animate-spin" />
              <div className="font-medium text-sm">Revisão automática em execução</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" indicatorClassName="bg-[#ff6e00]" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="bg-gray-50 px-6 py-3 rounded-md border border-gray-200 text-center">
              <div className="text-xs text-gray-500 mb-1">Próxima execução em</div>
              <div className="font-mono font-bold text-2xl">
                {formatTime(secondsToNext)}
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-3 mt-3 border-t text-xs text-gray-500">
          <p>
            A revisão automática de orçamentos está configurada para executar a cada 5 horas. O sistema executa automaticamente sem necessidade de intervenção manual.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
