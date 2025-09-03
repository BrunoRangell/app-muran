
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  RefreshCw, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText,
  Calendar 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AutoReviewTest() {
  const [selectedTab, setSelectedTab] = useState("execution-logs");
  const [isLoading, setIsLoading] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [realExecutionLogs, setRealExecutionLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();

  // Buscar logs ao carregar ou ao mudar de aba
  useEffect(() => {
    fetchLogs();
    
    // Configurar atualização automática a cada 10 segundos
    const intervalId = setInterval(() => {
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedTab]);

  // Função para buscar logs conforme a aba selecionada
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      // Buscar logs de execução (testes)
      const { data: execLogs, error: execError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "unified-meta-review-test-job")
        .or("details->test.eq.true")
        .order("execution_time", { ascending: false })
        .limit(20);
      
      if (execError) throw execError;
      setExecutionLogs(execLogs || []);
      
      // Buscar logs de execução REAIS
      const { data: realLogs, error: realError } = await supabase
        .from("cron_execution_logs")
        .select("*")
        .eq("job_name", "unified-meta-review-job")
        .or("details->executeReview.eq.true,details->test.eq.false")
        .order("execution_time", { ascending: false })
        .limit(20);
      
      if (realError) throw realError;
      setRealExecutionLogs(realLogs || []);
      
      // Buscar logs do sistema
      const { data: sysLogs, error: sysError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "cron_job")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (sysError) throw sysError;
      setSystemLogs(sysLogs || []);
      
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast({
        title: "Erro ao buscar logs",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para disparar uma solicitação de revisão manual
  const triggerManualTest = async () => {
    try {
      setIsLoading(true);
      
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Primeiro criar um log de execução
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "unified-meta-review-test-job",
          status: "started",
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_test",
            test: true,
            executeReview: false
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Chamar a função edge unificada diretamente com parâmetro de teste
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          clientIds: ['test-client-id'],
          reviewDate: new Date().toISOString().split('T')[0],
          source: "manual_test"
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text}`);
      }
      
      toast({
        title: "Teste iniciado com sucesso",
        description: "O teste da função edge foi iniciado manualmente. Verifique os logs para acompanhar o progresso.",
      });
      
      // Atualizar os logs após 2 segundos
      setTimeout(() => {
        fetchLogs();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao disparar teste manual:", error);
      toast({
        title: "Erro ao disparar teste",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para disparar uma EXECUÇÃO REAL manual
  const triggerManualRealExecution = async () => {
    try {
      setIsLoading(true);
      
      // Obter sessão para autenticação
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Sessão não encontrada. Por favor, faça login novamente");
      }
      
      // Primeiro criar um log de execução REAL
      const { data: logEntry, error: logError } = await supabase
        .from("cron_execution_logs")
        .insert({
          job_name: "unified-meta-review-job",
          status: "started",
          details: {
            timestamp: new Date().toISOString(),
            source: "manual_real_execution",
            test: false,
            executeReview: true,
            forceExecution: true
          }
        })
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Chamar a função edge unificada diretamente para execução REAL
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-meta-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          clientIds: 'all',
          reviewDate: new Date().toISOString().split('T')[0],
          source: "manual_real_execution"
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${text}`);
      }
      
      toast({
        title: "Execução real iniciada com sucesso",
        description: "A execução real foi iniciada manualmente. Verifique os logs de execução real para acompanhar o progresso.",
      });
      
      // Atualizar os logs após 2 segundos
      setTimeout(() => {
        fetchLogs();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao disparar execução real manual:", error);
      toast({
        title: "Erro ao disparar execução real",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar data e hora
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Função para renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
      case 'test_success':
      case 'active':
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case 'in_progress':
      case 'started':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Erro</Badge>;
      case 'partial_success':
        return <Badge className="bg-amber-500">Sucesso Parcial</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Monitoramento de Revisão Automática</CardTitle>
        <CardDescription>
          Acompanhe a execução e status das revisões automáticas do Meta Ads
        </CardDescription>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Atualizado em: {formatDateTime(lastRefreshed.toISOString())}
          </p>
          
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="execution-logs">Logs de Execução (Testes)</TabsTrigger>
            <TabsTrigger value="real-executions">Execuções Reais</TabsTrigger>
            <TabsTrigger value="system-logs">Logs do Sistema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="execution-logs">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Logs de Execução (Testes)</h3>
                
                <Button
                  size="sm"
                  onClick={triggerManualTest}
                  disabled={isLoading}
                  className="h-8 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Testar Manualmente
                </Button>
              </div>
              
              {executionLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum log de teste encontrado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="border rounded-md p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium mb-1 flex items-center">
                            {log.job_name}
                            <span className="mx-2">•</span>
                            {renderStatusBadge(log.status)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(log.execution_time)}
                          </div>
                        </div>
                      </div>
                      
                      {log.details && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            {log.details.source && (
                              <div>
                                <span className="font-medium">Fonte: </span>
                                {log.details.source}
                              </div>
                            )}
                            {log.details.message && (
                              <div>
                                <span className="font-medium">Mensagem: </span>
                                {log.details.message}
                              </div>
                            )}
                          </div>
                          
                          {log.status === 'error' && log.details.error && (
                            <div className="mt-1 text-red-500">
                              <span className="font-medium">Erro: </span>
                              {log.details.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="real-executions">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Execuções Reais</h3>
                
                <Button
                  size="sm"
                  onClick={triggerManualRealExecution}
                  disabled={isLoading}
                  className="h-8 bg-muran-primary hover:bg-muran-primary/90 text-white"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Executar Revisão Real
                </Button>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle>Sobre as Execuções Reais</AlertTitle>
                <AlertDescription className="text-xs">
                  As execuções reais são agendadas para ocorrer a cada 3 minutos, processando todos os clientes ativos com Meta Ads configurado.
                  Essas execuções atualizam os dados no painel principal.
                </AlertDescription>
              </Alert>
              
              {realExecutionLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma execução real encontrada</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {realExecutionLogs.map((log) => (
                    <div key={log.id} className="border rounded-md p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium mb-1 flex items-center">
                            Execução Real
                            <span className="mx-2">•</span>
                            {renderStatusBadge(log.status)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(log.execution_time)}
                          </div>
                        </div>
                      </div>
                      
                      {log.details && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            {log.details.source && (
                              <div>
                                <span className="font-medium">Fonte: </span>
                                {log.details.source}
                              </div>
                            )}
                            
                            {log.details.totalClients !== undefined && (
                              <div>
                                <span className="font-medium">Total Clientes: </span>
                                {log.details.totalClients}
                              </div>
                            )}
                            
                            {log.details.processedClients !== undefined && (
                              <div>
                                <span className="font-medium">Processados: </span>
                                {log.details.processedClients} 
                                {log.details.totalClients && ` de ${log.details.totalClients}`}
                                {log.details.percentComplete !== undefined && ` (${log.details.percentComplete}%)`}
                              </div>
                            )}
                            
                            <div className="col-span-2 grid grid-cols-3 gap-1 mt-1">
                              {log.details.successCount !== undefined && (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  <span>Sucessos: {log.details.successCount}</span>
                                </div>
                              )}
                              
                              {log.details.errorCount !== undefined && (
                                <div className="flex items-center text-red-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  <span>Erros: {log.details.errorCount}</span>
                                </div>
                              )}
                              
                              {log.details.skippedCount !== undefined && (
                                <div className="flex items-center text-amber-600">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  <span>Pulados: {log.details.skippedCount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {log.status === 'error' && log.details.error && (
                            <div className="mt-1 text-red-500">
                              <span className="font-medium">Erro: </span>
                              {log.details.error}
                            </div>
                          )}
                          
                          {log.details.completedAt && (
                            <div className="mt-1 text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="font-medium">Concluído em: </span>
                              {formatDateTime(log.details.completedAt)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="system-logs">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Logs do Sistema</h3>
              
              {systemLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum log do sistema encontrado</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {systemLogs.map((log) => (
                    <div key={log.id} className="border rounded-md p-3 text-sm">
                      <div className="font-medium mb-1">{log.message}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(log.created_at)}</div>
                      
                      {log.details && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <pre className="whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
