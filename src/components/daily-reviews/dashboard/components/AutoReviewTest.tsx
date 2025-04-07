
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, Play, Check, AlertCircle, CalendarClock, BarChart, Clock, Dot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/card";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchCronStatus();
    fetchExecutionLogs();
    fetchCronExpression();
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
      // Verificar registros de execução recentes
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
        
        // Se a última execução foi há menos de 6 horas, consideramos ativo
        if (hoursSince < 6) {
          setCronStatus('active');
          return;
        }
      }
      
      // Verificar logs do sistema como fallback
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
      
      // Se chegamos aqui, significa que não houve execuções recentes
      setCronStatus('inactive');
      
    } catch (error) {
      console.error("Erro ao verificar status do cron:", error);
      setCronStatus('unknown');
    }
  };

  const fetchExecutionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // Buscar logs de execução do cron
      const { data: cronLogs, error: cronLogsError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "daily-meta-review-job")
        .order("execution_time", { ascending: false })
        .limit(10);
        
      if (cronLogsError) {
        console.error("Erro ao buscar logs de execução:", cronLogsError);
      } else {
        setExecutionLogs(cronLogs || []);
      }
      
      // Buscar logs do sistema
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
      // Chamamos a função Edge diretamente para testar
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
      
      // Atualizar os logs após o teste
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
    
    // Explicar a expressão cron
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
