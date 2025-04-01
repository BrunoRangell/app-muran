
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Calendar, Check, RefreshCw, Clock, AlertCircle } from "lucide-react";

export function AutoReviewSettings() {
  const [lastAutoRun, setLastAutoRun] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunStatus, setLastRunStatus] = useState<'success' | 'error' | null>(null);
  const [cronStatus, setCronStatus] = useState<'active' | 'unknown' | 'inactive'>('unknown');
  const { toast } = useToast();

  // Buscar a última execução automática
  const fetchLastAutoRun = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se existe configuração salva
      const { data: configData, error: configError } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
        
      if (configError) {
        console.error("Erro ao buscar configuração:", configError);
        return;
      }
      
      if (configData?.value) {
        setLastAutoRun(new Date(configData.value));
        
        // Verificar se a execução foi recente (últimas 24 horas)
        const now = new Date();
        const lastRun = new Date(configData.value);
        const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRun <= 24) {
          setLastRunStatus('success');
        }
      }
      
      // Verificar status do cron verificando logs recentes
      const { data: cronLogs, error: cronError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(1);
        
      if (!cronError && cronLogs && cronLogs.length > 0) {
        const lastCronExecution = new Date(cronLogs[0].execution_time);
        const now = new Date();
        const hoursSinceLastCronExecution = (now.getTime() - lastCronExecution.getTime()) / (1000 * 60 * 60);
        
        // Se a última execução foi nas últimas 36 horas, consideramos o cron ativo
        if (hoursSinceLastCronExecution <= 36) {
          setCronStatus('active');
        } else {
          setCronStatus('inactive');
        }
      } else {
        // Se não houver logs, verificamos se há logs de sistema recentes
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const { data: systemLogs, error: systemLogsError } = await supabase
          .from("system_logs")
          .select("*")
          .eq("event_type", "cron_job")
          .gt("created_at", threeDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (!systemLogsError && systemLogs && systemLogs.length > 0) {
          setCronStatus('active');
        } else {
          setCronStatus('inactive');
        }
      }
    } catch (error) {
      console.error("Erro ao buscar última execução automática:", error);
      setLastRunStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Executar revisão manual
  const runManualReview = async () => {
    setIsRunning(true);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { manual: true }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Revisão em massa iniciada",
        description: "O processo de revisão foi iniciado com sucesso. Isso pode levar alguns minutos.",
      });
      
      // Aguardar um tempo antes de atualizar o status
      setTimeout(() => {
        fetchLastAutoRun();
      }, 5000);
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      setLastRunStatus('error');
      toast({
        title: "Erro ao iniciar revisão",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a revisão em massa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  // Função para verificar logs de erro recentes
  const checkErrorLogs = async () => {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "daily_meta_review")
        .gt("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      // Se houver logs com mensagem de erro, definir status como erro
      if (data) {
        const errorLogs = data.filter(log => 
          log.message.toLowerCase().includes("erro") || 
          (log.details && log.details.error)
        );
        
        if (errorLogs.length > 0) {
          setLastRunStatus('error');
        }
      }
    } catch (error) {
      console.error("Erro ao verificar logs:", error);
    }
  };

  useEffect(() => {
    fetchLastAutoRun();
    checkErrorLogs();
    
    // Atualizar o status a cada 15 minutos
    const intervalId = setInterval(() => {
      fetchLastAutoRun();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Renderizar indicador de status do cron
  const renderCronStatus = () => {
    switch (cronStatus) {
      case 'active':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check size={16} className="text-green-600" />
            <span>Agendamento ativo</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            <span>Agendamento inativo</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Status do agendamento desconhecido</span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Revisão Automática</CardTitle>
        <CardDescription>
          As revisões de orçamento são executadas automaticamente todos os dias às 06:00.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Última execução automática:</span>
            {lastAutoRun ? (
              <span className={`font-medium ${lastRunStatus === 'error' ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDateInBrasiliaTz(lastAutoRun, "dd 'de' MMMM 'às' HH:mm")}
                {lastRunStatus === 'error' && (
                  <span className="ml-2 text-red-600">(com falhas)</span>
                )}
              </span>
            ) : (
              <span className="italic text-gray-500">Nenhuma execução registrada</span>
            )}
          </div>
          
          {renderCronStatus()}
          
          <Button 
            onClick={runManualReview} 
            disabled={isLoading || isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Executando revisão...
              </>
            ) : isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Executar revisão agora
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-2">
            Esta operação irá executar uma revisão completa de todos os clientes com Meta Ads configurado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
