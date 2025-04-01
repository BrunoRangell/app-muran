
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

  const fetchLastAutoRun = async () => {
    try {
      if (isCheckingStatus) return;
      
      setIsLoading(true);
      setIsCheckingStatus(true);
      
      const { data: configData, error: configError } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
        
      if (configError) {
        console.error("Erro ao buscar configuração:", configError);
        setIsLoading(false);
        setIsCheckingStatus(false);
        return;
      }
      
      if (configData?.value) {
        setLastAutoRun(new Date(configData.value));
        setLastRunStatus('success');
      }
      
      await checkCronStatus();
      
      setIsLoading(false);
      setIsCheckingStatus(false);
    } catch (error) {
      console.error("Erro ao buscar última execução automática:", error);
      setLastRunStatus('error');
      setIsLoading(false);
      setIsCheckingStatus(false);
    }
  };

  const checkCronStatus = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!error && logs && logs.length > 0) {
        const lastLog = logs[0];
        const logTime = new Date(lastLog.created_at);
        const hoursSince = (new Date().getTime() - logTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          setCronStatus('active');
          return;
        }
      }
      
      if (lastAutoRun) {
        const hoursSinceLastRun = (new Date().getTime() - lastAutoRun.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 36) {
          setCronStatus('active');
          return;
        }
      }
      
      try {
        // Testar conexão com a função edge
        const response = await supabase.functions.invoke("daily-meta-review", {
          body: { 
            test: true,
            testType: "cron_status_check",
            timestamp: new Date().toISOString()
          }
        });
        
        console.log("Teste de status da função edge:", response);
        if (!response.error) {
          setCronStatus('active');
        } else {
          console.error("Erro no teste de função edge:", response.error);
          setCronStatus('inactive');
        }
        
        return;
      } catch (edgeFunctionError) {
        console.error("Erro ao testar função Edge:", edgeFunctionError);
        setCronStatus('inactive');
      }
      
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      setCronStatus('unknown');
    }
  };

  const runManualReview = async () => {
    setIsRunning(true);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { manual: true, source: "manual_trigger" }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Revisão em massa iniciada",
        description: "O processo de revisão foi iniciado com sucesso. Isso pode levar alguns minutos.",
      });
      
      await supabase.from("system_logs").insert({
        event_type: "cron_job",
        message: "Revisão iniciada manualmente pelo usuário",
        details: {
          manual: true,
          initiated_by: "user",
          timestamp: new Date().toISOString()
        }
      });
      
      try {
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
      } catch (logError) {
        console.warn("Aviso: Não foi possível registrar log de execução:", logError);
      }
      
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

  useEffect(() => {
    fetchLastAutoRun();
    
    const intervalId = setInterval(() => {
      if (!isCheckingStatus) {
        fetchLastAutoRun();
      }
    }, 60 * 1000); // Atualizado para verificar a cada minuto
    
    return () => clearInterval(intervalId);
  }, []);

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
          As revisões de orçamento são executadas automaticamente a cada 5 horas.
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
