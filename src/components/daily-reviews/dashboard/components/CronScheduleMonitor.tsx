
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CronScheduleMonitor() {
  const [nextExecution, setNextExecution] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<Date | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);
  const [cronError, setCronError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsToNext, setSecondsToNext] = useState<number>(0);
  const refreshTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // O intervalo de execução é de 3 minutos (180 segundos) para testes
  const EXECUTION_INTERVAL = 3 * 60; // 3 minutos em segundos

  const fetchCronStatus = async () => {
    try {
      setLoading(true);
      
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
      
      const validLogs = logs.filter(log => 
        ['success', 'partial_success', 'started', 'test_success'].includes(log.status)
      );
      
      if (validLogs.length > 0) {
        const lastLog = validLogs[0];
        setLastExecution(new Date(lastLog.execution_time));
        
        const minutesSince = (new Date().getTime() - new Date(lastLog.execution_time).getTime()) / (1000 * 60);
        
        if (minutesSince < 10) {
          setStatus('active');
          setCronError(null);
        } else {
          setStatus('inactive');
          setCronError(`Última execução foi há mais de 10 minutos (${Math.round(minutesSince)}min atrás)`);
        }
      } else {
        setStatus('inactive');
        setCronError('Nenhum log de execução válido encontrado');
      }
      
      setNextExecution("A cada 3 minutos (teste)");
      
      updateSecondsToNext();
      
    } catch (e) {
      console.error("Erro ao verificar status do cron:", e);
      setCronError(`Erro: ${e instanceof Error ? e.message : String(e)}`);
      setStatus('inactive');
    } finally {
      setLoading(false);
    }
  };

  const updateSecondsToNext = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Próximo minuto divisível por 3
    const nextIntervalMinute = Math.ceil(minutes / 3) * 3;
    
    if (nextIntervalMinute === minutes && seconds === 0) {
      // Estamos exatamente no tempo de execução
      setSecondsToNext(EXECUTION_INTERVAL);
    } else if (nextIntervalMinute === minutes) {
      // Estamos no minuto correto, mas não no segundo zero
      setSecondsToNext(60 - seconds + ((nextIntervalMinute + 3 - minutes) * 60) - 60);
    } else {
      // Calculamos os segundos até o próximo intervalo
      const secondsUntilNextMinute = 60 - seconds;
      const minutesUntilNextInterval = nextIntervalMinute - minutes - 1;
      
      setSecondsToNext(secondsUntilNextMinute + (minutesUntilNextInterval * 60));
    }
  };

  // Configurar contador regressivo
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prev => {
        if (prev <= 1) {
          updateSecondsToNext();
          // Verificar status quando o contador chega a zero
          fetchCronStatus();
          return EXECUTION_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchCronStatus();
    
    const intervalId = setInterval(() => {
      fetchCronStatus();
    }, 3 * 60 * 1000); // Verificar a cada 3 minutos
    
    return () => {
      clearInterval(intervalId);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchCronStatus();
    
    toast({
      title: "Dados atualizados",
      description: "Status da revisão automática atualizado com sucesso",
      variant: "default",
    });
    
    setTimeout(() => setRefreshing(false), 1000);
  };

  const testEdgeFunction = async () => {
    try {
      setRefreshing(true);
      
      toast({
        title: "Testando função",
        description: "Enviando solicitação de teste para a função Edge...",
        variant: "default",
      });
      
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { test: true, executeReview: true, manual: true }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Resposta do teste:", data);
      
      toast({
        title: "Teste concluído",
        description: "A função Edge respondeu com sucesso e uma revisão foi iniciada.",
        variant: "default",
      });
      
      refreshTimerRef.current = window.setTimeout(() => {
        fetchCronStatus();
      }, 2000);
      
      return true;
      
    } catch (e) {
      console.error("Erro ao testar função Edge:", e);
      toast({
        title: "Erro no teste",
        description: `Não foi possível conectar à função Edge: ${e instanceof Error ? e.message : String(e)}`,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gray-50 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#ff6e00]" />
          <span>Revisão Automática</span>
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Atualizar status"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ff6e00]' : 'text-gray-500'}`} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testEdgeFunction}
            disabled={refreshing}
          >
            Testar Agora
          </Button>
        </div>
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
                {Math.floor(secondsToNext / 60)}m {secondsToNext % 60}s
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Frequência:</div>
            <div className="text-sm font-medium bg-blue-50 text-blue-700 inline-flex items-center px-2 py-0.5 rounded">
              <Clock className="h-3.5 w-3.5 mr-1" />
              A cada 3 minutos (teste)
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
              A revisão automática de orçamentos está configurada para executar a cada 3 minutos para fins de teste.
              Você pode clicar em "Testar Agora" para iniciar uma revisão manual.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
