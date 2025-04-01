
-- Verificar e criar extensões necessárias se não existirem
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela para logs de sistema (já existe, mas mantido para referência)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para monitoramento de execuções do cron
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  details JSONB
);

-- Função para obter a expressão cron de um job
CREATE OR REPLACE FUNCTION public.get_cron_expression(job_name text)
RETURNS TABLE (cron_expression text) AS $$
BEGIN
  RETURN QUERY
  SELECT schedule
  FROM cron.job
  WHERE jobname = job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover jobs existentes se houver para evitar duplicidade
SELECT cron.unschedule('daily-meta-review-job');
SELECT cron.unschedule('cron-health-check');
SELECT cron.unschedule('cron-status-keeper');

-- Criar job para executar revisão Meta Ads às 16:30 (ajustado o horário para teste)
SELECT cron.schedule(
  'daily-meta-review-job',
  '30 16 * * *',  -- Executa às 16:30 todos os dias (horário ajustado para futuro teste)
  $$
  -- Primeiro registrar o início da execução no log
  INSERT INTO public.cron_execution_logs (job_name, execution_time, status, details)
  VALUES (
    'daily-meta-review-job', 
    now(), 
    'started', 
    jsonb_build_object('timestamp', now())
  );
  
  -- Invocar a função Edge com token de serviço para garantir autenticação
  SELECT
    net.http_post(
      url:='https://socrnutfpqtcjmetskta.supabase.co/functions/v1/daily-meta-review',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw"}'::jsonb,
      body:='{"scheduled": true, "source": "cron"}'::jsonb
    ) as request_id;
    
  -- Registrar a tentativa no log do sistema
  INSERT INTO public.system_logs (event_type, message, details)
  VALUES ('cron_job', 'Tentativa de execução da revisão diária Meta Ads', jsonb_build_object('timestamp', now(), 'source', 'scheduled_job'));
  $$
);

-- Modificar o componente CronScheduleMonitor para refletir o novo horário
<lov-write file_path="src/components/daily-reviews/dashboard/components/CronScheduleMonitor.tsx">
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
        
        // Verificar se a última execução foi recente (nas últimas 24 horas)
        const hoursSince = (new Date().getTime() - new Date(lastLog.execution_time).getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          setStatus('active');
          setCronError(null);
        } else {
          setStatus('inactive');
          setCronError(`Última execução foi há mais de 24h (${Math.round(hoursSince)}h atrás)`);
        }
      } else {
        // Se não há logs válidos
        setStatus('inactive');
        setCronError('Nenhum log de execução válido encontrado');
      }
      
      // Calcular próxima execução
      try {
        const { data: cronData, error: cronError } = await supabase.rpc('get_cron_expression', { 
          job_name: 'daily-meta-review-job' 
        });
        
        if (cronError) {
          console.warn("Erro ao obter expressão cron:", cronError);
          setNextExecution("16:30 diariamente");
          return;
        }
        
        if (cronData && typeof cronData === 'object' && 'cron_expression' in cronData) {
          setNextExecution(`Agendamento: ${cronData.cron_expression}`);
        } else {
          setNextExecution("16:30 diariamente");
        }
      } catch (cronError) {
        console.warn("Não foi possível obter expressão cron:", cronError);
        setNextExecution("16:30 diariamente");
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
    targetTime.setHours(16, 30, 0, 0); // Atualizado para 16:30
    
    // Se já passou das 16:30 hoje, a próxima execução é amanhã
    if (now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30)) {
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
            Agendado para executar automaticamente às 16:30 - próxima execução em{" "}
            {getMinutesToNextExecution()}{" "}
            minutos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
