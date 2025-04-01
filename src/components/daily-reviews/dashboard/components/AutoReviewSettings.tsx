
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
      
      // Verificar configuração salva
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
        setLastRunStatus('success'); // Definir como sucesso por padrão, será atualizado mais tarde se houver erros
      }
      
      // Verificar se há logs de erro recentes
      await checkErrorLogs();
      
      // Verificar o status do cron
      await checkCronStatus();
    } catch (error) {
      console.error("Erro ao buscar última execução automática:", error);
      setLastRunStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar status do cron verificando logs recentes
  const checkCronStatus = async () => {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Verificar execuções de cron recentes
      const { data: cronLogs, error: cronError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .gt("execution_time", twoDaysAgo.toISOString())
        .order("execution_time", { ascending: false })
        .limit(1);
        
      if (!cronError && cronLogs && cronLogs.length > 0) {
        // Se temos logs recentes, o cron está ativo
        setCronStatus('active');
        return;
      }
      
      // Se não temos logs específicos de cron, verificar logs do sistema
      const { data: systemLogs, error: systemLogsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .gt("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (!systemLogsError && systemLogs && systemLogs.length > 0) {
        setCronStatus('active');
        return;
      }
      
      // Se chegamos aqui, não encontramos nenhuma evidência de atividade recente
      setCronStatus('inactive');
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      setCronStatus('unknown');
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
      
      // Verificar logs de erro específicos
      const { data: errorLogs, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "daily_meta_review")
        .gt("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (logsError) {
        console.error("Erro ao buscar logs:", logsError);
        return;
      }
      
      // Se não encontrarmos logs, não podemos determinar se há erros
      if (!errorLogs || errorLogs.length === 0) {
        return;
      }
      
      // Procurar por mensagens de erro nos logs
      const hasErrors = errorLogs.some(log => 
        log.message.toLowerCase().includes("erro") || 
        (log.details && (
          log.details.error || 
          log.details.falhas > 0
        ))
      );
      
      if (hasErrors) {
        setLastRunStatus('error');
      }
    } catch (error) {
      console.error("Erro ao verificar logs:", error);
    }
  };

  useEffect(() => {
    fetchLastAutoRun();
    
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
            <span>Verificando status do agendamento</span>
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
