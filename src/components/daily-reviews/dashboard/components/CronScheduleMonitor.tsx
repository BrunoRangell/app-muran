
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
      
      // Buscar logs de execução do cron para o job específico
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
      
      // Filtrar logs bem-sucedidos ou em andamento
      const validLogs = logs.filter(log => 
        ['success', 'partial_success', 'started', 'test_success'].includes(log.status)
      );
      
      if (validLogs.length > 0) {
        const lastLog = validLogs[0];
        setLastExecution(new Date(lastLog.execution_time));
        
        // Verificar se a última execução foi recente (nos últimos 10 minutos para testes)
        const minutesSince = (new Date().getTime() - new Date(lastLog.execution_time).getTime()) / (1000 * 60);
        
        if (minutesSince < 10) {
          setStatus('active');
          setCronError(null);
        } else {
          setStatus('inactive');
          setCronError(`Última execução foi há mais de 10 minutos (${Math.round(minutesSince)}min atrás)`);
        }
      } else {
        // Se não há logs válidos
        setStatus('inactive');
        setCronError('Nenhum log de execução válido encontrado');
      }
      
      // Cron expression agora é "* * * * *" (a cada minuto)
      setNextExecution("A cada minuto");
      
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
    
    // Atualizar status a cada 15 segundos para capturar as execuções por minuto
    const intervalId = setInterval(fetchCronStatus, 15 * 1000);
    
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

  // Calcular tempo para próxima execução (agora é sempre menos de 1 minuto)
  const getSecondsToNextExecution = () => {
    const now = new Date();
    const seconds = 60 - now.getSeconds();
    return seconds;
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
              {formatDateInBrasiliaTz(lastExecution, "dd 'de' MMMM 'às' HH:mm:ss")}
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
            Agendado para executar automaticamente a cada minuto - próxima execução em aproximadamente{" "}
            {getSecondsToNextExecution()}{" "}
            segundos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
