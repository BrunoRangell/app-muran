
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Play, Check, AlertCircle, CalendarClock, BarChart, Clock, Dot, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateInBrasiliaTz } from "../../summary/utils";

export function AutoReviewTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cronStatus, setCronStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [cronExpression, setCronExpression] = useState<string>("");
  const [executionModeTab, setExecutionModeTab] = useState<'tests' | 'real-executions'>('real-executions');
  const [realExecutionLogs, setRealExecutionLogs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCronStatus();
    fetchExecutionLogs();
    fetchCronExpression();
    fetchRealExecutionLogs();
  }, []);

  const fetchCronExpression = async () => {
    try {
      const { data, error } = await supabase.rpc('get_cron_expression', {
        job_name: 'daily-meta-review-job'
      });
      
      if (error) {
        console.error("Erro ao buscar expressão cron:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setCronExpression(data[0].cron_expression || '*/3 * * * *');
      }
    } catch (error) {
      console.error("Erro ao buscar expressão cron:", error);
    }
  };

  const fetchCronStatus = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Erro ao buscar logs de execução:", error);
        setCronStatus('unknown');
        return;
      }
      
      if (logs && logs.length > 0) {
        const lastLog = logs[0];
        const executionTime = new Date(lastLog.execution_time);
        const hoursSince = (new Date().getTime() - executionTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 6) {
          setCronStatus('active');
          return;
        }
      }
      
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
        
        if (hoursSince < 6) {
          setCronStatus('active');
          return;
        }
      }
      
      setCronStatus('inactive');
      
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      setCronStatus('unknown');
    }
  };

  const fetchRealExecutionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // Modificação importante aqui: buscar explicitamente logs onde executeReview = true na details
      // ou logs com status success, in_progress, partial_success (sinais de execução real)
      const { data: realLogs, error: realLogsError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .or(`status.eq.success,status.eq.in_progress,status.eq.partial_success,status.eq.started`)
        .order("execution_time", { ascending: false })
        .limit(15);
        
      if (realLogsError) {
        console.error("Erro ao buscar logs de execução real:", realLogsError);
      } else {
        // Filtrar para mostrar apenas logs de execução real com executeReview: true
        const realExecutions = realLogs?.filter(log => {
          // Se o status é 'success', 'partial_success' ou 'in_progress'
          if (['success', 'partial_success', 'in_progress'].includes(log.status)) {
            return true;
          }
          
          // Ou se no details tem executeReview = true
          if (log.details && (log.details.executeReview === true || log.details.type === 'real_execution')) {
            return true;
          }
          
          return false;
        }) || [];
        
        setRealExecutionLogs(realExecutions);
      }
    } catch (error) {
      console.error("Erro ao buscar logs de execução real:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchExecutionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // Buscar explicitamente logs de testes (onde executeReview não é true)
      const { data: cronLogs, error: cronLogsError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .not("details->executeReview", "eq", true)
        .or(`status.eq.test_success,status.eq.active`)
        .order("execution_time", { ascending: false })
        .limit(10);
        
      if (cronLogsError) {
        console.error("Erro ao buscar logs de execução:", cronLogsError);
      } else {
        setExecutionLogs(cronLogs || []);
      }
      
      const { data: sysLogs, error: sysLogsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (sysLogsError) {
        console.error("Erro ao buscar logs do sistema:", sysLogsError);
      } else {
        setSystemLogs(sysLogs || []);
      }
      
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const testCronFunction = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { 
          test: true, 
          timestamp: new Date().toISOString(),
          source: "manual_test",
          executeReview: false
        }
      });
      
      if (error) {
        throw new Error(`Erro ao testar função: ${error.message}`);
      }
      
      setResult(data);
      
      await Promise.all([
        fetchCronStatus(),
        fetchExecutionLogs()
      ]);
      
      toast({
        title: "Teste realizado com sucesso",
        description: "A função Edge de revisão diária está funcionando corretamente.",
      });
    } catch (error) {
      console.error("Erro ao testar função:", error);
      setResult(null);
      
      toast({
        title: "Falha no teste",
        description: error instanceof Error ? error.message : "Não foi possível testar a função Edge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerRealExecution = async () => {
    setIsLoading(true);
    try {
      const { data: logEntry } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "daily-meta-review-job",
          status: "started",
          details: { 
            timestamp: new Date().toISOString(),
            source: "manual_trigger",
            executeReview: true
          }
        })
        .select()
        .single();
        
      const logId = logEntry?.id;
        
      const { data, error } = await supabase.functions.invoke("daily-meta-review", {
        body: { 
          executeReview: true, 
          timestamp: new Date().toISOString(),
          source: "manual_trigger",
          scheduled: false,
          logId
        }
      });
      
      if (error) {
        throw new Error(`Erro ao iniciar execução real: ${error.message}`);
      }
      
      setResult(data);
      
      await Promise.all([
        fetchCronStatus(),
        fetchRealExecutionLogs()
      ]);
      
      toast({
        title: "Execução real iniciada",
        description: "A execução real da revisão diária foi iniciada. Acompanhe o progresso nos logs.",
      });
    } catch (error) {
      console.error("Erro ao iniciar execução real:", error);
      setResult(null);
      
      toast({
        title: "Falha ao iniciar execução real",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a execução real.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'success': { color: 'bg-green-100 text-green-800', label: 'Sucesso' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Concluído' },
      'error': { color: 'bg-red-100 text-red-800', label: 'Erro' },
      'started': { color: 'bg-blue-100 text-blue-800', label: 'Iniciado' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'Em Progresso' },
      'partial_success': { color: 'bg-orange-100 text-orange-800', label: 'Sucesso Parcial' },
      'test_success': { color: 'bg-purple-100 text-purple-800', label: 'Teste Bem-sucedido' },
      'active': { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      'unknown': { color: 'bg-gray-100 text-gray-800', label: 'Desconhecido' }
    };
    
    const defaultStatus = { color: 'bg-gray-100 text-gray-800', label: status };
    const statusConfig = statusMap[status] || defaultStatus;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    );
  };

  const renderCronExpressionHelp = () => {
    if (!cronExpression) return null;
    
    let explanation = "Este agendamento ocorre ";
    const parts = cronExpression.split(" ");
    
    if (parts[0] === "*") {
      explanation += "a cada minuto";
    } else if (parts[0].startsWith("*/")) {
      const minutes = parseInt(parts[0].substring(2));
      explanation += `a cada ${minutes} minutos`;
    }
    
    if (parts[1] === "*" && parts[0] !== "*" && !parts[0].startsWith("*/")) {
      explanation += " em qualquer hora";
    } else if (parts[1].startsWith("*/")) {
      const hours = parseInt(parts[1].substring(2));
      explanation += `, a cada ${hours} horas`;
    }
    
    return explanation;
  };

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="status">Status do Agendamento</TabsTrigger>
        <TabsTrigger value="real-executions">Execuções Reais</TabsTrigger>
        <TabsTrigger value="test">Testar Função</TabsTrigger>
        <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
        <TabsTrigger value="system-logs">Logs do Sistema</TabsTrigger>
      </TabsList>
      
      <TabsContent value="status">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Estado do Agendamento</CardTitle>
            <CardDescription>
              Detalhes sobre o agendamento da revisão automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-muran-primary" />
                  <div>
                    <p className="font-medium">Agendamento:</p>
                    <p className="text-sm text-gray-500">{cronExpression || "*/3 * * * *"}</p>
                  </div>
                </div>
                
                <div>
                  {cronStatus === 'active' ? (
                    <Badge className="bg-green-100 hover:bg-green-200 text-green-800 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                      </span>
                      Ativo
                    </Badge>
                  ) : cronStatus === 'inactive' ? (
                    <Badge className="bg-red-100 hover:bg-red-200 text-red-800 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Inativo
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Verificando
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg">
                <p className="text-sm font-medium">Explicação:</p>
                <p className="text-sm">{renderCronExpressionHelp()}</p>
              </div>
              
              {executionLogs && executionLogs.length > 0 && (
                <div className="border p-3 rounded-lg">
                  <p className="font-medium mb-2">Última execução:</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-500">Data:</span>{" "}
                      {formatDateInBrasiliaTz(
                        new Date(executionLogs[0].execution_time),
                        "dd/MM/yyyy HH:mm:ss"
                      )}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      {getStatusBadge(executionLogs[0].status)}
                    </p>
                    {executionLogs[0].details && executionLogs[0].details.message && (
                      <p>
                        <span className="text-gray-500">Mensagem:</span>{" "}
                        {executionLogs[0].details.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <Button
                onClick={() => {
                  fetchCronStatus();
                  fetchExecutionLogs();
                  fetchCronExpression();
                  fetchRealExecutionLogs();
                  
                  toast({
                    title: "Status atualizado",
                    description: "As informações de agendamento foram atualizadas.",
                  });
                }}
                className="w-full"
                variant="outline"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Atualizar Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="real-executions">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Execuções Reais</CardTitle>
            <CardDescription>
              Histórico e controle das execuções reais de revisão automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={triggerRealExecution} 
              disabled={isLoading}
              className="w-full bg-muran-primary hover:bg-muran-primary/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando execução real...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Iniciar Execução Real Agora
                </>
              )}
            </Button>
            
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Diferença entre Testes e Execuções Reais</AlertTitle>
              <AlertDescription className="text-xs">
                <p className="mb-2">As execuções reais processam todos os clientes e atualizam os dados de orçamento, enquanto os testes apenas verificam a conectividade.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Execuções reais são agendadas para ocorrer a cada 3 minutos</li>
                  <li>Cada execução processa todos os clientes ativos com Meta Ads configurado</li>
                  <li>O processamento pode levar alguns minutos, dependendo do número de clientes</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Histórico de Execuções Reais:</h3>
              
              {isLoadingLogs ? (
                <div className="flex justify-center p-4">
                  <Loader className="h-5 w-5 animate-spin text-muran-primary" />
                </div>
              ) : realExecutionLogs.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {realExecutionLogs.map((log) => (
                      <div key={log.id} className="border p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">
                            {formatDateInBrasiliaTz(
                              new Date(log.execution_time),
                              "dd/MM/yyyy HH:mm:ss"
                            )}
                          </p>
                          {getStatusBadge(log.status)}
                        </div>
                        
                        {log.details && (
                          <div className="text-sm space-y-1 mt-2">
                            {log.details.message && (
                              <p><span className="text-gray-500">Mensagem:</span> {log.details.message}</p>
                            )}
                            
                            <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                              <div className="text-center bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500">Processados</p>
                                <p className="font-bold text-muran-complementary">
                                  {log.details.totalClients !== undefined ? log.details.totalClients : "-"}
                                </p>
                              </div>
                              
                              <div className="text-center bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500">Sucessos</p>
                                <p className="font-bold text-green-600">
                                  {log.details.successCount !== undefined ? log.details.successCount : "-"}
                                </p>
                              </div>
                              
                              <div className="text-center bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-500">Erros</p>
                                <p className="font-bold text-red-600">
                                  {log.details.errorCount !== undefined ? log.details.errorCount : "-"}
                                </p>
                              </div>
                            </div>
                            
                            {log.details.source && (
                              <p><span className="text-gray-500">Origem:</span> {log.details.source === 'cron' ? 'Agendamento automático' : 'Execução manual'}</p>
                            )}
                            
                            {log.details.error && (
                              <p className="text-red-600"><span className="text-gray-500">Erro:</span> {log.details.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-4 text-gray-500 border rounded-lg">
                  <p>Nenhuma execução real encontrada. Use o botão acima para iniciar uma.</p>
                </div>
              )}
              
              <Button
                onClick={fetchRealExecutionLogs}
                className="w-full mt-4"
                variant="outline"
              >
                <BarChart className="mr-2 h-4 w-4" />
                Atualizar Logs de Execução Real
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="test">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Teste de Conectividade</CardTitle>
            <CardDescription>
              Verifique se a função Edge de revisão diária está acessível
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testCronFunction} 
              disabled={isLoading}
              className="w-full bg-muran-complementary hover:bg-muran-complementary/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Testar Função Edge
                </>
              )}
            </Button>
            
            {result && (
              <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-auto max-h-40">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
            
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium">O que este teste verifica:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Se a função Edge está publicada e acessível</li>
                <li>Se o token de autenticação é válido</li>
                <li>Se a função consegue responder corretamente</li>
                <li>Se a conexão com o banco de dados está funcionando</li>
              </ul>
              <p className="mt-2 text-amber-600 font-medium">Importante: Este teste apenas verifica a conectividade, mas não executa a revisão real de clientes.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="logs">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Logs de Execução</CardTitle>
            <CardDescription>
              Histórico das execuções da revisão automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex justify-center p-4">
                <Loader className="h-5 w-5 animate-spin text-muran-primary" />
              </div>
            ) : executionLogs.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="border p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">
                          {formatDateInBrasiliaTz(
                            new Date(log.execution_time),
                            "dd/MM/yyyy HH:mm:ss"
                          )}
                        </p>
                        {getStatusBadge(log.status)}
                      </div>
                      
                      {log.details && (
                        <div className="text-sm space-y-1 mt-2">
                          {log.details.message && (
                            <p><span className="text-gray-500">Mensagem:</span> {log.details.message}</p>
                          )}
                          
                          {log.details.totalClients !== undefined && (
                            <p><span className="text-gray-500">Total de clientes:</span> {log.details.totalClients}</p>
                          )}
                          
                          {log.details.successCount !== undefined && (
                            <p><span className="text-gray-500">Sucessos:</span> {log.details.successCount}</p>
                          )}
                          
                          {log.details.errorCount !== undefined && (
                            <p><span className="text-gray-500">Erros:</span> {log.details.errorCount}</p>
                          )}
                          
                          {log.details.error && (
                            <p className="text-red-600"><span className="text-gray-500">Erro:</span> {log.details.error}</p>
                          )}
                          
                          {log.details.isAutomatic !== undefined && (
                            <p><span className="text-gray-500">Tipo:</span> {log.details.isAutomatic ? 'Automático' : 'Manual'}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <p>Nenhum log de execução encontrado</p>
              </div>
            )}
            
            <Button
              onClick={fetchExecutionLogs}
              className="w-full mt-4"
              variant="outline"
            >
              <BarChart className="mr-2 h-4 w-4" />
              Atualizar Logs
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="system-logs">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Logs do Sistema</CardTitle>
            <CardDescription>
              Registros de eventos do sistema relacionados ao agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex justify-center p-4">
                <Loader className="h-5 w-5 animate-spin text-muran-primary" />
              </div>
            ) : systemLogs.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {systemLogs.map((log) => (
                    <div key={log.id} className="border p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">
                          {formatDateInBrasiliaTz(
                            new Date(log.created_at),
                            "dd/MM/yyyy HH:mm:ss"
                          )}
                        </p>
                      </div>
                      
                      <p className="text-sm mb-1">{log.message}</p>
                      
                      {log.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500">Detalhes</summary>
                          <pre className="mt-1 bg-gray-50 p-2 rounded overflow-auto max-h-20 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <p>Nenhum log do sistema encontrado</p>
              </div>
            )}
            
            <Button
              onClick={fetchExecutionLogs}
              className="w-full mt-4"
              variant="outline"
            >
              <BarChart className="mr-2 h-4 w-4" />
              Atualizar Logs
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
