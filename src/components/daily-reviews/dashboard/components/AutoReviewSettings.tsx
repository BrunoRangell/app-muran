
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatDateInBrasiliaTz } from "../../summary/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Calendar, Check, Clock, AlertCircle, BarChart } from "lucide-react";
import { useBatchReview } from "../../hooks/useBatchReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoReviewTest } from "./AutoReviewTest";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export function AutoReviewSettings() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [cronStatus, setCronStatus] = useState<'active' | 'unknown' | 'inactive'>('unknown');
  const [lastExecutionInfo, setLastExecutionInfo] = useState<{
    time: string | null;
    status: string | null;
    clientsProcessed: number | null;
    successCount: number | null;
    errorCount: number | null;
  }>({
    time: null,
    status: null,
    clientsProcessed: null,
    successCount: null,
    errorCount: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    reviewAllClients, 
    lastBatchReviewTime,
    isBatchAnalyzing
  } = useBatchReview();

  const fetchCronStatus = async () => {
    try {
      if (isCheckingStatus) return;
      
      setIsCheckingStatus(true);
      
      // Buscar logs de execução recentes
      const { data: logs, error } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(1);
      
      if (!error && logs && logs.length > 0) {
        const lastLog = logs[0];
        setLastExecutionInfo({
          time: lastLog.execution_time,
          status: lastLog.status,
          clientsProcessed: lastLog.details?.processedClients || null,
          successCount: lastLog.details?.successCount || null,
          errorCount: lastLog.details?.errorCount || null
        });
        
        const logTime = new Date(lastLog.execution_time);
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
      
      // Verificar logs do sistema
      const { data: systemLogs, error: systemLogsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!systemLogsError && systemLogs && systemLogs.length > 0) {
        const lastLog = systemLogs[0];
        const logTime = new Date(lastLog.created_at);
        const hoursSince = (new Date().getTime() - logTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 12) {
          setCronStatus('active');
          setIsCheckingStatus(false);
          return;
        }
      }
      
      // Fazer teste direto na função Edge
      try {
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

  const runManualReview = () => {
    // Primeiro vamos navegar para a aba de clientes
    const clientsTab = document.querySelector('[value="clientes"]') as HTMLElement;
    if (clientsTab) {
      clientsTab.click();
      
      // Esperar um momento para garantir que a navegação ocorreu
      setTimeout(() => {
        // Agora executamos a análise
        reviewAllClients();
        
        // Invalidar as queries para forçar atualização dos dados
        queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
        queryClient.invalidateQueries({ queryKey: ["last-batch-review-info"] });
        
        // Notificar o usuário
        toast({
          title: "Análise iniciada",
          description: "A análise foi iniciada e você pode acompanhar o progresso na aba Clientes.",
        });
      }, 100);
    } else {
      // Caso não encontre a tab, executa de qualquer forma
      reviewAllClients();
      toast({
        title: "Análise iniciada",
        description: "A análise foi iniciada. Por favor, vá para a aba Clientes para acompanhar o progresso.",
      });
    }
  };

  useEffect(() => {
    fetchCronStatus();
    
    const intervalId = setInterval(() => {
      if (!isCheckingStatus) {
        fetchCronStatus();
      }
    }, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isCheckingStatus]);

  const renderStatusBadge = () => {
    switch (cronStatus) {
      case 'active':
        return (
          <Badge className="bg-green-100 hover:bg-green-200 text-green-800 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            Agendamento ativo
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-red-100 hover:bg-red-200 text-red-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Agendamento inativo
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Verificando status
          </Badge>
        );
    }
  };

  return (
    <div className="mt-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="test">Diagnóstico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Revisão Automática</CardTitle>
                    <CardDescription>
                      As revisões de orçamento são executadas automaticamente a cada 5 horas.
                    </CardDescription>
                  </div>
                  {renderStatusBadge()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar size={16} />
                        <span className="font-medium">Última execução:</span>
                      </div>
                      
                      {lastBatchReviewTime ? (
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {formatDateInBrasiliaTz(new Date(lastBatchReviewTime), "dd 'de' MMMM 'às' HH:mm")}
                          </p>
                          {lastExecutionInfo.status && (
                            <p className="text-xs mt-1">
                              <span>Status: </span>
                              <span className={`font-medium ${
                                lastExecutionInfo.status.includes('success') || lastExecutionInfo.status === 'completed' 
                                  ? 'text-green-600' 
                                  : lastExecutionInfo.status === 'error' 
                                    ? 'text-red-600' 
                                    : 'text-blue-600'
                              }`}>
                                {lastExecutionInfo.status === 'success' || lastExecutionInfo.status === 'completed' 
                                  ? 'Concluído com sucesso' 
                                  : lastExecutionInfo.status === 'error' 
                                    ? 'Erro' 
                                    : lastExecutionInfo.status === 'partial_success'
                                      ? 'Sucesso parcial'
                                      : lastExecutionInfo.status}
                              </span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="italic text-sm text-gray-500">Nenhuma execução registrada</p>
                      )}
                    </div>
                    
                    {(lastExecutionInfo.clientsProcessed !== null || 
                     lastExecutionInfo.successCount !== null || 
                     lastExecutionInfo.errorCount !== null) && (
                      <div className="border p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <BarChart size={16} />
                          <span className="font-medium">Estatísticas:</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Processados</p>
                            <p className="font-bold text-muran-complementary">
                              {lastExecutionInfo.clientsProcessed !== null ? lastExecutionInfo.clientsProcessed : "-"}
                            </p>
                          </div>
                          
                          <div className="text-center bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Sucessos</p>
                            <p className="font-bold text-green-600">
                              {lastExecutionInfo.successCount !== null ? lastExecutionInfo.successCount : "-"}
                            </p>
                          </div>
                          
                          <div className="text-center bg-gray-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Erros</p>
                            <p className="font-bold text-red-600">
                              {lastExecutionInfo.errorCount !== null ? lastExecutionInfo.errorCount : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={runManualReview} 
                    disabled={isBatchAnalyzing}
                    className="w-full bg-muran-primary hover:bg-muran-primary/90"
                  >
                    {isBatchAnalyzing ? (
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
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <p className="font-medium mb-1">Informações importantes:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Esta operação irá executar uma revisão completa de todos os clientes com Meta Ads configurado</li>
                      <li>O agendamento automático ocorre a cada 5 horas através de cron</li>
                      <li>Para verificar detalhes completos, use a aba de Diagnóstico</li>
                      <li>A execução pode levar alguns minutos, dependendo do número de clientes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="test">
          <AutoReviewTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
