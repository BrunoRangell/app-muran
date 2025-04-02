
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CronScheduleMonitor() {
  const [lastExecutions, setLastExecutions] = useState<any[]>([]);
  const [cronExpression, setCronExpression] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "warning" | "error" | "unknown">("unknown");
  const { toast } = useToast();

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
        
        // Analisar a saúde do agendamento
        analyzeScheduleHealth(executions);
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
    const wasSuccessful = lastStatus === 'success' || lastStatus === 'completed';
    
    // Para o intervalo de teste de 3 minutos
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
        // Nota: Esta parte é importante, mas só pode ser feita via SQL em uma mensagem separada
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
      setIsLoading(true);
      
      // Criar registro na tabela de logs
      const { data: logEntry, error: logError } = await supabase
        .from('cron_execution_logs')
        .insert({
          job_name: 'daily-meta-review-job',
          status: 'started',
          details: {
            source: 'manual_trigger',
            timestamp: new Date().toISOString(),
            triggered_from: 'monitor_component'
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
      
      toast({
        title: "Revisão iniciada",
        description: "A revisão automática foi iniciada manualmente.",
      });
      
      // Recarregar dados após um breve intervalo
      setTimeout(() => {
        loadScheduleData();
      }, 2000);
      
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

  useEffect(() => {
    // Carregar dados ao montar o componente
    loadScheduleData();
    
    // Configurar verificação periódica
    const interval = setInterval(() => {
      loadScheduleData();
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
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
        return <span className="text-green-600 font-medium">Sucesso</span>;
      case 'started':
        return <span className="text-orange-500 font-medium">Em andamento</span>;
      case 'error':
        return <span className="text-red-600 font-medium">Falha</span>;
      case 'partial_success':
        return <span className="text-yellow-600 font-medium">Parcial</span>;
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff6e00]" />
          Status do Agendamento (Teste: 3 minutos)
          {healthStatus === "healthy" && <CheckCircle className="h-5 w-5 text-green-500" />}
          {healthStatus === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          {healthStatus === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div>
              <p className="text-sm font-medium">Expressão Cron:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {cronExpression || "Não disponível"}
              </code>
              <p className="text-xs text-gray-500 mt-1">
                Configurado para executar a cada 3 minutos (teste)
              </p>
            </div>
            
            <div className="flex gap-2">
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
                disabled={isLoading}
                className="bg-[#ff6e00] hover:bg-[#e66300]"
              >
                Iniciar Revisão
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={repairSchedule} 
                disabled={isLoading}
              >
                Reparar
              </Button>
            </div>
          </div>
          
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
                          {exec.details?.message || 
                           (exec.details?.completedAt ? `Completado: ${new Date(exec.details.completedAt).toLocaleTimeString()}` : "")}
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
                Tente usar o botão "Reparar" ou "Iniciar Revisão" para forçar uma execução manual.
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
          
          <p className="text-xs text-gray-500 italic">
            Este componente é usado apenas em ambiente de testes para diagnosticar problemas com o agendamento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
