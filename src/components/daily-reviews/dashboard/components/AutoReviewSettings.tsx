
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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();

  // Buscar a última execução automática
  const fetchLastAutoRun = async () => {
    try {
      if (isCheckingStatus) return; // Evita chamadas simultâneas
      
      setIsLoading(true);
      setIsCheckingStatus(true);
      
      // Verificar configuração salva
      const { data: configData, error: configError } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
        
      if (configError) {
        console.error("Erro ao buscar configuração:", configError);
        setIsCheckingStatus(false);
        setIsLoading(false);
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
      
      setIsCheckingStatus(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar última execução automática:", error);
      setLastRunStatus('error');
      setIsCheckingStatus(false);
      setIsLoading(false);
    }
  };
  
  // Verificar status do cron verificando logs recentes
  const checkCronStatus = async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      // Define um timeout para esta operação
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout na verificação de status do cron")), 5000);
      });
      
      // Verificar execuções de cron recentes
      const cronLogsPromise = supabase
        .from("cron_execution_logs")
        .select("*")
        .gte("execution_time", threeDaysAgo.toISOString())
        .order("execution_time", { ascending: false })
        .limit(5);
      
      // Corrida entre a promessa principal e o timeout
      const { data: cronLogs, error: cronError } = await Promise.race([
        cronLogsPromise,
        timeoutPromise
      ]) as any;
        
      if (cronError) {
        console.error("Erro ao buscar logs de cron:", cronError);
        // Se houver erro na tabela (como table não existir), verificamos por última revisão apenas
        if (lastAutoRun) {
          const hoursSinceLastRun = (new Date().getTime() - lastAutoRun.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastRun < 36) {
            setCronStatus('active');
          } else {
            setCronStatus('inactive');
          }
        } else {
          setCronStatus('unknown');
        }
        return;
      }
      
      console.log("Logs de cron encontrados:", cronLogs?.length || 0, cronLogs);
      
      // Se temos logs recentes, o cron está ativo
      if (cronLogs && cronLogs.length > 0) {
        // Verificar se há execuções recentes nas últimas 24h
        const recentLogs = cronLogs.filter(log => {
          const logTime = new Date(log.execution_time);
          const hoursSince = (new Date().getTime() - logTime.getTime()) / (1000 * 60 * 60);
          return hoursSince < 24;
        });
        
        if (recentLogs.length > 0) {
          setCronStatus('active');
          return;
        }
      }
      
      // Se não temos logs específicos de cron, verificar logs do sistema
      const systemLogsPromise = supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .gte("created_at", threeDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);
      
      // Corrida entre a promessa principal e o timeout
      const { data: systemLogs } = await Promise.race([
        systemLogsPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout na verificação de logs do sistema")), 3000);
        })
      ]) as any;
      
      console.log("Logs de sistema encontrados:", systemLogs?.length || 0);
      
      if (systemLogs && systemLogs.length > 0) {
        // Verificar se há logs recentes nas últimas 24h
        const recentLogs = systemLogs.filter(log => {
          const logTime = new Date(log.created_at);
          const hoursSince = (new Date().getTime() - logTime.getTime()) / (1000 * 60 * 60);
          return hoursSince < 24;
        });
        
        if (recentLogs.length > 0) {
          setCronStatus('active');
          return;
        }
      }
      
      // Verificar se há uma revisão recente
      if (lastAutoRun) {
        const hoursSinceLastRun = (new Date().getTime() - lastAutoRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 36) { // Se temos uma execução recente (menos de 36h), consideramos o cron como ativo
          setCronStatus('active');
          return;
        }
      }
      
      // Se chegamos aqui, não encontramos nenhuma evidência de atividade recente
      setCronStatus('inactive');
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      
      // Se houver um erro na verificação, mas temos uma execução recente, consideramos ativo
      if (lastAutoRun) {
        const hoursSinceLastRun = (new Date().getTime() - lastAutoRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 36) {
          setCronStatus('active');
          return;
        }
      }
      
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
      
      // Registrar a execução manual no log
      await supabase.from("cron_execution_logs").insert({
        job_name: "manual-meta-review",
        execution_time: new Date().toISOString(),
        status: "started",
        details: {
          manual: true,
          initiated_by: "user",
          message: "Revisão iniciada manualmente pelo usuário"
        }
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
      
      // Define um timeout para esta operação
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout na verificação de logs de erro")), 5000);
      });
      
      // Verificar logs de erro específicos
      const logsPromise = supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "daily_meta_review")
        .gte("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);
        
      // Corrida entre a promessa principal e o timeout
      const { data: errorLogs, error: logsError } = await Promise.race([
        logsPromise,
        timeoutPromise
      ]) as any;
        
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
        log.message?.toLowerCase().includes("erro") || 
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
      // Se houver timeout, não alteramos o status
    }
  };

  useEffect(() => {
    fetchLastAutoRun();
    
    // Atualizar o status a cada 15 minutos
    const intervalId = setInterval(() => {
      if (!isCheckingStatus) {
        fetchLastAutoRun();
      }
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
            className="w-full bg-muran-primary hover:bg-muran-primary/90"
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
