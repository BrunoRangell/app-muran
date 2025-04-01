
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

  const fetchCronStatus = async () => {
    try {
      setLoading(true);
      
      // Buscar o último log de execução do cron
      const { data: logs, error } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Erro ao buscar logs de execução:", error);
        setStatus('inactive');
        return;
      }
      
      if (logs && logs.length > 0) {
        const lastLog = logs[0];
        setLastExecution(new Date(lastLog.execution_time));
        
        // Verificar se a última execução foi recente (nas últimas 24 horas)
        const hoursSince = (new Date().getTime() - new Date(lastLog.execution_time).getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          setStatus('active');
        } else {
          setStatus('inactive');
        }
      }
      
      // Calcular a próxima execução com base no agendamento cron
      try {
        // Estamos usando um intervalo fixo para simulação, mas idealmente consultaríamos o banco
        // para obter a expressão cron exata
        const { data: cronData } = await supabase.rpc('get_cron_expression', { 
          job_name: 'daily-meta-review-job' 
        });
        
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
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronStatus();
    
    // Atualizar status a cada 5 minutos
    const intervalId = setInterval(fetchCronStatus, 5 * 60 * 1000);
    
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
          
          <p className="text-xs text-gray-500 mt-2">
            Agendado para executar automaticamente às 16:00 - próxima execução em{" "}
            {Math.round((new Date(new Date().setHours(16, 0, 0, 0)).getTime() - new Date().getTime()) / (1000 * 60))}{" "}
            minutos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
