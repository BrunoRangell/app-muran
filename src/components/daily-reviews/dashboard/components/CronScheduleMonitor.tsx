
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";

export function CronScheduleMonitor() {
  const [nextExecution, setNextExecution] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);
  const [cronError, setCronError] = useState<string | null>(null);

  const fetchCronStatus = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os logs de execução do cron para ter uma visão mais completa
      const { data: logs, error } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(10);
      
      if (error) {
        console.error("Erro ao buscar logs de execução:", error);
        setCronError(`Erro ao verificar status: ${error.message}`);
        setStatus('inactive');
        return;
      }
      
      if (!logs || logs.length === 0) {
        console.log("Nenhum log de execução encontrado");
        setCronError("Nenhum registro de execução encontrado");
        setStatus('inactive');
        setLoading(false);
        return;
      }
      
      // Obter o último log de execução bem-sucedido ou iniciado
      const validLogs = logs.filter(log => 
        ['success', 'partial_success', 'started', 'test_success'].includes(log.status)
      );
      
      if (validLogs.length > 0) {
        const lastLog = validLogs[0];
        setLastExecution(new Date(lastLog.execution_time));
        
        // Verificar se a última execução foi recente (nas últimas 24 horas)
        const hoursSince = (new Date().getTime() - new Date(lastLog.execution_time).getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          setStatus('active');
          setCronError(null);
        } else {
          setStatus('inactive');
          setCronError(`Última execução foi há mais de 24h (${Math.round(hoursSince)}h atrás)`);
        }
      } else if (logs.length > 0) {
        // Se há logs, mas nenhum com status de sucesso
        const lastLog = logs[0];
        setLastExecution(new Date(lastLog.execution_time));
        setStatus('inactive');
        setCronError(`Última execução com status: ${lastLog.status}`);
      }
      
      // Calcular a próxima execução com base no agendamento cron
      try {
        const { data: cronData, error: cronError } = await supabase.rpc('get_cron_expression', { 
          job_name: 'daily-meta-review-job' 
        });
        
        if (cronError) {
          console.warn("Erro ao obter expressão cron:", cronError);
          setNextExecution("16:00 diariamente");
          return;
        }
        
        if (cronData && typeof cronData === 'object' && 'cron_expression' in cronData) {
          setNextExecution(`Agendamento: ${cronData.cron_expression}`);
        } else {
          // Fallback para o horário que sabemos
          setNextExecution("16:00 diariamente");
        }
      } catch (cronError) {
        console.warn("Não foi possível obter expressão cron:", cronError);
        setNextExecution("16:00 diariamente");
      }
      
    } catch (e) {
      console.error("Erro ao verificar status do cron:", e);
      setCronError(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronStatus();
    
    // Atualizar status a cada 3 minutos
    const intervalId = setInterval(fetchCronStatus, 3 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const renderStatusIcon = () => {
    if (loading) return <Clock className="h-5 w-5 animate-pulse text-gray-400" />;
    
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // Calcular tempo para próxima execução
  const getMinutesToNextExecution = () => {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(16, 0, 0, 0);
    
    // Se já passou das 16h hoje, a próxima execução é amanhã
    if (now.getHours() >= 16) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return Math.round((targetTime.getTime() - now.getTime()) / (1000 * 60));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>Status do Agendamento</span>
          {renderStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-semibold">Próxima execução:</span>{" "}
            {nextExecution || "Carregando..."}
          </div>
          
          {lastExecution && (
            <div className="text-sm">
              <span className="font-semibold">Última execução:</span>{" "}
              {formatDateInBrasiliaTz(lastExecution, "dd 'de' MMMM 'às' HH:mm")}
            </div>
          )}
          
          <div className="text-sm">
            <span className="font-semibold">Status:</span>{" "}
            <span className={`${status === 'active' ? 'text-green-600' : status === 'inactive' ? 'text-amber-600' : 'text-gray-500'}`}>
              {status === 'active' ? 'Ativo' : status === 'inactive' ? 'Inativo' : 'Verificando...'}
            </span>
          </div>
          
          {cronError && (
            <div className="mt-1 text-xs text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100">
              {cronError}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Agendado para executar automaticamente às 16:00 - próxima execução em{" "}
            {getMinutesToNextExecution()}{" "}
            minutos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
