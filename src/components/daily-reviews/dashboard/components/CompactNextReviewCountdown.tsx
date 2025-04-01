
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
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
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
      const { data } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .eq('status', 'started')
        .order('execution_time', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setIsAutoReviewing(true);
        // Buscar o progresso atual da revisão
        fetchReviewProgress();
      } else {
        setIsAutoReviewing(false);
        setProgress(0);
      }
    } catch (error) {
      console.error("Erro ao verificar revisão ativa:", error);
    }
  };

  // Buscar o progresso da revisão em andamento
  const fetchReviewProgress = async () => {
    try {
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
          setProgress(progressValue);
          
          // Se o progresso for 100%, a revisão terminou
          if (progressValue >= 100) {
            setIsAutoReviewing(false);
            
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

  // Executar a revisão automática
  const executeAutoReview = async () => {
    if (isAutoReviewing) return; // Não executar se já estiver em andamento
    
    try {
      setIsAutoReviewing(true);
      
      console.log("Contador chegou a zero, executando revisão automática...");
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { manual: true, executeReview: true }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Revisão automática iniciada:", data);
      
      toast({
        title: "Revisão automática iniciada",
        description: "O processo de revisão foi iniciado com sucesso",
        variant: "default",
      });
      
      // Iniciar verificação de progresso
      fetchReviewProgress();
      
    } catch (error) {
      console.error("Erro ao executar revisão automática:", error);
      
      toast({
        title: "Erro na revisão automática",
        description: "Não foi possível executar a revisão automática",
        variant: "destructive",
      });
      
      setIsAutoReviewing(false);
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
          console.log("Contador chegou a zero, executando revisão automática...");
          executeAutoReview();
          updateSecondsToNext();
          return EXECUTION_INTERVAL;
        }
        return prev - 1;
      });
      
      // Verificar o progresso a cada 3 segundos se estiver em revisão
      if (isAutoReviewing) {
        fetchReviewProgress();
      }
    }, 1000);
    
    // Limpeza quando o componente for desmontado
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isAutoReviewing]);

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
    </div>
  );
}
