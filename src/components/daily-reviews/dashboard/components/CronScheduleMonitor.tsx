
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useBatchReview } from "../../hooks/useBatchReview";

export function CronScheduleMonitor() {
  const [lastExecutions, setLastExecutions] = useState<any[]>([]);
  const [cronExpression, setCronExpression] = useState<string>("");
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "warning" | "error" | "unknown">("unknown");
  const { toast } = useToast();
  const { 
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze
  } = useBatchReview();

  // Função para carregar os dados do agendamento
  const loadScheduleData = async () => {
    try {
      setIsLoading(true);
      
      // Obter a expressão cron atual
      const { data: cronData, error: cronError } = await supabase.rpc(
        'get_cron_expression',
        { job_name: 'daily-meta-review-job' }
      );
      
      if (cronError) throw cronError;
      if (cronData && cronData.length > 0) {
        setCronExpression(cronData[0].cron_expression);
      }
      
      // Obter as últimas execuções
      const { data: executions, error: execError } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .eq('job_name', 'daily-meta-review-job')
        .order('execution_time', { ascending: false })
        .limit(5);
      
      if (execError) throw execError;
      if (executions) {
        setLastExecutions(executions);
        
        // Analisar a saúde do agendamento e calcular próxima execução
        analyzeScheduleHealth(executions);
        calculateNextRunTime(cronData?.[0]?.cron_expression, executions);
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados do agendamento:", error);
      toast({
        title: "Erro ao carregar agendamento",
        description: "Não foi possível obter informações do agendamento.",
        variant: "destructive",
      });
      setHealthStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Analisar a saúde do agendamento
  const analyzeScheduleHealth = (executions: any[]) => {
    if (!executions || executions.length === 0) {
      setHealthStatus("error");
      return;
    }
    
    const now = new Date();
    const lastExecution = new Date(executions[0].execution_time);
    const minutesSinceLastExecution = (now.getTime() - lastExecution.getTime()) / (1000 * 60);
    
    // Verificar se a última execução foi concluída com sucesso
    const lastStatus = executions[0].status;
    const wasSuccessful = lastStatus === 'success' || lastStatus === 'completed' || lastStatus === 'test_success';
    
    // Para o intervalo de teste de 3 minutos (posteriormente será ajustado para 5 horas)
    if (minutesSinceLastExecution > 10) {
      // Se passou mais de 10 minutos desde a última execução, algo está errado
      setHealthStatus("error");
    } else if (minutesSinceLastExecution > 5) {
      // Se passou mais de 5 minutos, é um alerta
      setHealthStatus("warning");
    } else if (!wasSuccessful && minutesSinceLastExecution > 3) {
      // Se a última não foi bem-sucedida e já passou o tempo de uma nova execução
      setHealthStatus("warning");
    } else {
      setHealthStatus("healthy");
    }
  };

  // Calcular o tempo da próxima execução com base na expressão cron
  const calculateNextRunTime = (cronExpr: string | undefined, executions: any[]) => {
    if (!cronExpr) return;
    
    try {
      // Para expressão de teste de 3 minutos, calculamos a próxima execução
      // baseada na última execução + 3 minutos
      if (executions && executions.length > 0) {
        const lastExecution = new Date(executions[0].execution_time);
        const nextExecution = new Date(lastExecution.getTime() + 3 * 60 * 1000);
        
        // Se a próxima execução já passou, calcular a partir de agora
        if (nextExecution < new Date()) {
          const now = new Date();
          const minutes = now.getMinutes();
          const nextMinute = Math.ceil(minutes / 3) * 3;
          
          const nextRun = new Date(now);
          nextRun.setMinutes(nextMinute);
          nextRun.setSeconds(0);
          nextRun.setMilliseconds(0);
          
          // Se já passou desse minuto, adicionar 3 minutos
          if (nextRun <= now) {
            nextRun.setMinutes(nextRun.getMinutes() + 3);
          }
          
          setNextRunTime(nextRun);
        } else {
          setNextRunTime(nextExecution);
        }
      } else {
        // Se não há execuções anteriores, calcular a partir de agora
        const now = new Date();
        const minutes = now.getMinutes();
        const nextMinute = Math.ceil(minutes / 3) * 3;
        
        const nextRun = new Date(now);
        nextRun.setMinutes(nextMinute);
        nextRun.setSeconds(0);
        nextRun.setMilliseconds(0);
        
        // Se já passou desse minuto, adicionar 3 minutos
        if (nextRun <= now) {
          nextRun.setMinutes(nextRun.getMinutes() + 3);
        }
        
        setNextRunTime(nextRun);
      }
    } catch (error) {
      console.error("Erro ao calcular próxima execução:", error);
      setNextRunTime(null);
    }
  };

  // Função para tentar corrigir o agendamento
  const repairSchedule = async () => {
    try {
      setIsLoading(true);
      
      // 1. Verificar se o cron ainda existe
      const { data: cronData } = await supabase.rpc(
        'get_cron_expression',
        { job_name: 'daily-meta-review-job' }
      );
      
      // 2. Se não existir, recriar o agendamento via SQL
      if (!cronData || cronData.length === 0) {
        toast({
          title: "Agendamento não encontrado",
          description: "O agendamento do cron não foi encontrado. Por favor, execute o SQL de configuração novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // 3. Criar um registro de execução manual para "forçar" o cron
      const { data: logEntry, error: logError } = await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            source: 'manual_repair',
            timestamp: new Date().toISOString(),
            repair_attempt: true
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // 4. Chamar a função edge diretamente
      const { error: edgeError } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: {
            executeReview: true,
            manual: true,
            repair: true,
            logId: logEntry.id,
            timestamp: new Date().toISOString()
          }
        }
      );
      
      if (edgeError) throw edgeError;
      
      toast({
        title: "Reparo iniciado",
        description: "Tentativa de reparo do agendamento iniciada com sucesso.",
      });
      
      // Recarregar dados após um breve intervalo
      setTimeout(() => {
        loadScheduleData();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao reparar agendamento:", error);
      toast({
        title: "Erro no reparo",
        description: "Não foi possível reparar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para iniciar uma revisão manual
  const triggerManualReview = async () => {
    try {
      // Usar a mesma função que o botão "Analisar todos" usa
      await reviewAllClients();
      
      // Recarregar dados após um breve intervalo
      setTimeout(() => {
        loadScheduleData();
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      toast({
        title: "Erro ao iniciar revisão",
        description: "Não foi possível iniciar a revisão automática.",
        variant: "destructive",
      });
    }
  };

  // Função para limpar logs antigos com status "started" ou "in_progress"
  const resetStuckJobs = async () => {
    try {
      setIsLoading(true);
      
      // Atualizar execuções antigas com status "started" ou "in_progress" para "error"
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .update({
          status: 'error',
          details: {
            message: 'Execução travada e marcada como erro manualmente',
            reset_timestamp: new Date().toISOString(),
            original_status: 'started'
          }
        })
        .in('status', ['started', 'in_progress'])
        .lt('execution_time', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Execuções mais antigas que 10 minutos
        
      if (error) throw error;
      
      // Também resetar o status de processamento em lote, se necessário
      const { data: batchConfig } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "batch_review_progress")
        .single();
        
      if (batchConfig?.value && 
          batchConfig.value.status === 'running' && 
          new Date(batchConfig.value.startTime).getTime() < Date.now() - 10 * 60 * 1000) {
        
        await supabase
          .from("system_configs")
          .update({
            value: {
              ...batchConfig.value,
              status: 'error',
              completedAt: new Date().toISOString(),
              message: 'Processo em lote interrompido manualmente'
            }
          })
          .eq("key", "batch_review_progress");
      }
      
      toast({
        title: "Execuções travadas resetadas",
        description: "Execuções antigas com status 'em andamento' foram marcadas como erro.",
      });
      
      // Recarregar dados
      loadScheduleData();
      
    } catch (error) {
      console.error("Erro ao resetar execuções travadas:", error);
      toast({
        title: "Erro ao resetar execuções",
        description: "Não foi possível resetar as execuções travadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar o tempo restante
  const formatTimeRemaining = () => {
    if (!nextRunTime) return "Indisponível";
    
    const now = new Date();
    const diff = nextRunTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Executando agora...";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    // Carregar dados ao montar o componente
    loadScheduleData();
    
    // Configurar atualizações periódicas do contador e dos dados
    const timerInterval = setInterval(() => {
      // Apenas para atualizar o contador sem fazer requisição
      setNextRunTime(prev => prev);
    }, 1000);
    
    const dataInterval = setInterval(() => {
      loadScheduleData();
    }, 5000); // Verificar a cada 5 segundos
    
    return () => {
      clearInterval(timerInterval);
      clearInterval(dataInterval);
    };
  }, []);

  // Formatador de data/hora para exibição
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  // Formatador para status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'test_success':
        return <span className="text-green-600 font-medium">Sucesso</span>;
      case 'started':
        return <span className="text-orange-500 font-medium">Iniciado</span>;
      case 'in_progress':
        return <span className="text-blue-500 font-medium">Em andamento</span>;
      case 'error':
        return <span className="text-red-600 font-medium">Falha</span>;
      case 'partial_success':
        return <span className="text-yellow-600 font-medium">Parcial</span>;
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  // Se existe um processo em lote em andamento, mostrar seu progresso
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff6e00]" />
          Status da Revisão Automática
          {healthStatus === "healthy" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {healthStatus === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          {healthStatus === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Próxima execução */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div>
              <p className="text-sm font-medium">Próxima execução automática:</p>
              <div className="text-2xl font-bold text-[#ff6e00]">
                {formatTimeRemaining()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configurado para executar a cada 3 minutos (teste)
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={loadScheduleData} 
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={triggerManualReview} 
                disabled={isBatchAnalyzing}
                className="bg-[#ff6e00] hover:bg-[#e66300]"
              >
                Iniciar Agora
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={repairSchedule} 
                disabled={isLoading || isBatchAnalyzing}
              >
                Reparar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={resetStuckJobs}
                disabled={isLoading}
              >
                Resetar Travados
              </Button>
            </div>
          </div>
          
          {/* Barra de progresso se houver um lote em andamento */}
          {isBatchAnalyzing && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progresso da análise automática</span>
                <span className="text-sm text-gray-500">
                  {batchProgress || 0} de {totalClientsToAnalyze} ({progressPercentage}%)
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2" 
                indicatorClassName="bg-[#ff6e00]" 
              />
            </div>
          )}
          
          {/* Últimas execuções */}
          <div>
            <h3 className="text-sm font-medium mb-2">Últimas Execuções:</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Data/Hora</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Fonte</th>
                    <th className="p-2 text-left">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {lastExecutions.length > 0 ? (
                    lastExecutions.map((exec) => (
                      <tr key={exec.id} className="border-b">
                        <td className="p-2">{formatDateTime(exec.execution_time)}</td>
                        <td className="p-2">{getStatusLabel(exec.status)}</td>
                        <td className="p-2">{exec.details?.source || "cron"}</td>
                        <td className="p-2">
                          {exec.details?.message ? exec.details.message : ""}
                          {exec.details?.completedAt && 
                            ` Completado: ${new Date(exec.details.completedAt).toLocaleTimeString()}`}
                          {exec.status === "in_progress" && exec.details?.processedClients && (
                            <span className="text-blue-500 ml-1">
                              ({exec.details.processedClients}/{exec.details.totalClients || '?'})
                            </span>
                          )}
                          {(exec.status === "started" || exec.status === "in_progress") && 
                            <span className="text-orange-500 ml-1">(em processamento)</span>
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-2 text-center">
                        Nenhuma execução encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {healthStatus === "error" && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              <p className="font-medium">Problema detectado no agendamento</p>
              <p className="text-xs mt-1">
                O agendamento parece não estar funcionando corretamente. 
                Tente usar o botão "Resetar Travados" para limpar execuções pendentes, 
                ou "Reparar" para forçar uma reconfiguração, 
                ou "Iniciar Agora" para forçar uma execução manual.
              </p>
            </div>
          )}
          
          {healthStatus === "warning" && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
              <p className="font-medium">Aviso no agendamento</p>
              <p className="text-xs mt-1">
                O agendamento pode estar com problemas. Monitore as próximas execuções.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
