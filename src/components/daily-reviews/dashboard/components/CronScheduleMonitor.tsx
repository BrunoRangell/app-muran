
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Button } from "@/components/ui/button";

export function CronScheduleMonitor() {
  const [nextExecution, setNextExecution] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);
  const [cronError, setCronError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Calcular tempo para próxima execução (agora é sempre menos de 1 minuto)
  const getSecondsToNextExecution = () => {
    const now = new Date();
    const seconds = 60 - now.getSeconds();
    return seconds;
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchCronStatus();
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#ff6e00]" />
          <span>Revisão Automática</span>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ff6e00]' : 'text-gray-500'}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Status:</div>
              <div className="flex items-center gap-1.5">
                {status === 'loading' ? (
                  <Clock className="h-5 w-5 animate-pulse text-gray-400" />
                ) : status === 'active' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <span className={`font-medium ${
                  status === 'active' ? 'text-green-600' : 
                  status === 'inactive' ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {status === 'active' ? 'Ativo' : 
                   status === 'inactive' ? 'Inativo' : 'Verificando...'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500">Próxima execução em</div>
              <div className="font-mono font-bold text-lg">
                {getSecondsToNextExecution()}s
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Frequência:</div>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 inline-flex items-center px-2 py-0.5 rounded">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {nextExecution || "Carregando..."}
            </div>
          </div>
          
          {lastExecution && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Última execução:</div>
              <div className="text-sm">
                {formatDateInBrasiliaTz(lastExecution, "dd 'de' MMMM 'às' HH:mm:ss")}
              </div>
            </div>
          )}
          
          {cronError && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
              {cronError}
            </div>
          )}
          
          <div className="pt-3 border-t text-xs text-gray-500">
            <p>
              A revisão automática de orçamentos está configurada para executar a cada minuto para facilitar os testes. Você pode verificar os resultados na tabela de clientes abaixo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
