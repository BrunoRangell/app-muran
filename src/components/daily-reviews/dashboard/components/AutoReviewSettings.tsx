
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Calendar, Check, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { useBatchReview } from "../../hooks/useBatchReview";

export function AutoReviewSettings() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [cronStatus, setCronStatus] = useState<'active' | 'unknown' | 'inactive'>('unknown');
  const { toast } = useToast();
  
  // Usando o mesmo hook de batchReview que é usado no botão "Analisar todos"
  const { 
    reviewAllClients, 
    lastBatchReviewTime, 
    isLoading: isRunning
  } = useBatchReview();

  const fetchCronStatus = async () => {
    try {
      if (isCheckingStatus) return;
      
      setIsCheckingStatus(true);
      
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
          setIsCheckingStatus(false);
          return;
        }
      }
      
      if (lastBatchReviewTime) {
        const hoursSinceLastRun = (new Date().getTime() - new Date(lastBatchReviewTime).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 36) {
          setCronStatus('active');
          setIsCheckingStatus(false);
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
      } catch (edgeFunctionError) {
        console.error("Erro ao testar função Edge:", edgeFunctionError);
        setCronStatus('inactive');
      }
      
      setIsCheckingStatus(false);
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      setCronStatus('unknown');
      setIsCheckingStatus(false);
    }
  };

  const runManualReview = async () => {
    try {
      // Usando a mesma função que é chamada pelo botão "Analisar todos"
      await reviewAllClients();
      
      // Registrar no log
      await supabase.from("system_logs").insert({
        event_type: "cron_job",
        message: "Revisão iniciada manualmente pelo usuário",
        details: {
          manual: true,
          initiated_by: "user",
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error("Erro ao iniciar revisão manual:", error);
      toast({
        title: "Erro ao iniciar revisão",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a revisão em massa.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCronStatus();
    
    const intervalId = setInterval(() => {
      if (!isCheckingStatus) {
        fetchCronStatus();
      }
    }, 60 * 1000); // Verificar a cada minuto
    
    return () => clearInterval(intervalId);
  }, [isCheckingStatus]);

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
            {lastBatchReviewTime ? (
              <span className="font-medium text-gray-900">
                {formatDateInBrasiliaTz(new Date(lastBatchReviewTime), "dd 'de' MMMM 'às' HH:mm")}
              </span>
            ) : (
              <span className="italic text-gray-500">Nenhuma execução registrada</span>
            )}
          </div>
          
          {renderCronStatus()}
          
          <Button 
            onClick={runManualReview} 
            disabled={isRunning}
            className="w-full bg-muran-primary hover:bg-muran-primary/90"
          >
            {isRunning ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Executando revisão...
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
