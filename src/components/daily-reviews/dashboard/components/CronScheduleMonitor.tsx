
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
  const [executingReview, setExecutingReview] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
      
      setNextExecution("A cada minuto");
      
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
    const seconds = 60 - now.getSeconds();
    setSecondsToNext(seconds);
  };

  const handleCountdownEnd = () => {
    console.log("Contador chegou a zero, executando revisão automática...");
    
    // Indicar que estamos executando a revisão
    setExecutingReview(true);
    
    // Executar a revisão automaticamente ao zerar o contador
    testEdgeFunction()
      .then(() => {
        console.log("Revisão automática executada com sucesso");
        toast({
          title: "Revisão automática executada",
          description: "O processo de revisão foi iniciado com sucesso",
          variant: "default",
        });
      })
      .catch((err) => {
        console.error("Erro ao executar revisão automática:", err);
        toast({
          title: "Erro na revisão automática",
          description: "Não foi possível executar a revisão automática",
          variant: "destructive",
        });
      })
      .finally(() => {
        // Depois de tentar executar a revisão, atualizar o status
        setTimeout(() => {
          fetchCronStatus();
          setExecutingReview(false);
          toast({
            title: "Verificando execução",
            description: "Atualizando status da revisão automática...",
            variant: "default",
          });
        }, 3000);
      });
  };

  useEffect(() => {
    fetchCronStatus();
    
    const intervalId = setInterval(fetchCronStatus, 15 * 1000);
    
    // Limpeza ao desmontar o componente
    return () => {
      clearInterval(intervalId);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Efeito separado para o contador regressivo
  useEffect(() => {
    // Limpar qualquer contador existente
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Criar um novo contador regressivo
    countdownRef.current = setInterval(() => {
      setSecondsToNext(prev => {
        // Se chegou a zero, acionar o evento
        if (prev <= 1) {
          handleCountdownEnd();
          return 60; // Reiniciar para 60 segundos
        }
        return prev - 1;
      });
    }, 1000);
    
    // Limpeza quando o componente for desmontado
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
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
        body: { test: true }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Resposta do teste:", data);
      
      // Agora vamos invocar novamente para executar a revisão de fato (não apenas teste)
      const { data: execData, error: execError } = await supabase.functions.invoke("daily-meta-review", {
        body: { manual: true, executeReview: true }
      });
      
      if (execError) {
        throw execError;
      }
      
      console.log("Resposta da execução:", execData);
      
      toast({
        title: "Revisão iniciada",
        description: "A função Edge está processando a revisão dos orçamentos",
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
            disabled={refreshing || executingReview}
            title="Atualizar status"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ff6e00]' : 'text-gray-500'}`} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testEdgeFunction}
            disabled={refreshing || executingReview}
          >
            Testar
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
                {secondsToNext}s
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
