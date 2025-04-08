
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader, AlertTriangle, CheckCircle, RefreshCw, Code } from "lucide-react";
import { useMetaReviewService } from "./hooks/useMetaReviewService";
import { supabase } from "@/lib/supabase";

export function EdgeFunctionDiagnostics() {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("diagnostico");
  const [edgeFunctionLogs, setEdgeFunctionLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const { toast } = useToast();
  const { testMetaReviewFunction, lastConnectionStatus, lastErrorMessage, lastErrorDetails } = useMetaReviewService();

  const runDiagnostics = async () => {
    setIsChecking(true);
    setCheckResults(null);
    
    try {
      // Coletar informações de diagnóstico
      const results: any = {
        timestamp: new Date().toISOString(),
        checks: []
      };
      
      // Verificar se a função Edge está acessível
      try {
        const testResult = await testMetaReviewFunction();
        results.checks.push({
          name: "Função Edge Meta Review",
          status: testResult.success ? "success" : "error",
          message: testResult.success 
            ? "Função Edge está acessível" 
            : `Erro ao acessar função Edge: ${testResult.error}`,
          details: testResult
        });
      } catch (error) {
        results.checks.push({
          name: "Função Edge Meta Review",
          status: "error",
          message: `Erro ao testar função Edge: ${error instanceof Error ? error.message : String(error)}`,
          error
        });
      }
      
      // Verificar configurações do sistema
      try {
        const { data: autoReviewConfig } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "auto_review_enabled")
          .maybeSingle();
        
        results.checks.push({
          name: "Configuração de Revisão Automática",
          status: "success",
          message: `Revisão automática está ${autoReviewConfig?.value === "true" ? "ativada" : "desativada"}`,
          details: autoReviewConfig
        });
      } catch (error) {
        results.checks.push({
          name: "Configuração de Revisão Automática",
          status: "error",
          message: `Erro ao verificar configuração: ${error instanceof Error ? error.message : String(error)}`,
          error
        });
      }
      
      // Buscar entradas de log recentes
      try {
        const { data: logs } = await supabase
          .from("cron_execution_logs")
          .select("*")
          .eq("job_name", "daily-meta-review-job")
          .order("created_at", { ascending: false })
          .limit(5);
        
        results.checks.push({
          name: "Logs de Execução Recentes",
          status: "success",
          message: `Encontrados ${logs?.length || 0} logs recentes`,
          details: logs
        });
      } catch (error) {
        results.checks.push({
          name: "Logs de Execução Recentes",
          status: "error",
          message: `Erro ao buscar logs: ${error instanceof Error ? error.message : String(error)}`,
          error
        });
      }
      
      // Definir resultado geral
      const hasErrors = results.checks.some((check: any) => check.status === "error");
      results.overall = {
        status: hasErrors ? "error" : "success",
        message: hasErrors 
          ? "Foram encontrados problemas que precisam ser resolvidos" 
          : "Todos os testes passaram com sucesso"
      };
      
      setCheckResults(results);
      
      toast({
        title: hasErrors ? "Problemas encontrados" : "Diagnóstico concluído",
        description: results.overall.message,
        variant: hasErrors ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
      toast({
        title: "Erro no diagnóstico",
        description: "Ocorreu um erro ao executar o diagnóstico.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const fetchEdgeFunctionLogs = async () => {
    setIsLoadingLogs(true);
    
    try {
      const { data: logs, error } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "edge_function")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        throw error;
      }
      
      setEdgeFunctionLogs(logs || []);
      
      toast({
        title: "Logs carregados",
        description: `Carregados ${logs?.length || 0} logs de função Edge.`,
      });
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro ao carregar logs",
        description: "Não foi possível carregar os logs da função Edge.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleClearStatus = () => {
    setCheckResults(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Função Edge</CardTitle>
          <CardDescription>
            Ferramentas para diagnóstico e solução de problemas com a função Edge
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="solucoes">Soluções</TabsTrigger>
            </TabsList>
            
            <TabsContent value="diagnostico" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={runDiagnostics} 
                  disabled={isChecking}
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  {isChecking ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Executar Diagnóstico
                    </>
                  )}
                </Button>
                
                {checkResults && (
                  <Button variant="outline" onClick={handleClearStatus}>
                    Limpar resultados
                  </Button>
                )}
              </div>
              
              {lastConnectionStatus === "error" && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Problema de conexão detectado</AlertTitle>
                  <AlertDescription>
                    {lastErrorMessage || "Erro na conexão com a função Edge"}
                  </AlertDescription>
                </Alert>
              )}
              
              {checkResults && (
                <div className="mt-4 space-y-4">
                  <Alert variant={checkResults.overall.status === "success" ? "default" : "destructive"}>
                    {checkResults.overall.status === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{checkResults.overall.status === "success" ? "Diagnóstico concluído" : "Problemas encontrados"}</AlertTitle>
                    <AlertDescription>{checkResults.overall.message}</AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    {checkResults.checks.map((check: any, index: number) => (
                      <div key={index} className="border rounded-md p-3">
                        <div className="flex items-center">
                          {check.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">{check.name}</span>
                        </div>
                        <p className={`mt-1 text-sm ${check.status === "success" ? "text-green-600" : "text-red-600"}`}>
                          {check.message}
                        </p>
                        
                        {check.details && check.name === "Logs de Execução Recentes" && check.details.length > 0 && (
                          <div className="mt-2 border-t pt-2">
                            <p className="text-sm font-medium mb-1">Execuções recentes:</p>
                            <div className="space-y-1">
                              {check.details.map((log: any, i: number) => (
                                <div key={i} className="text-xs bg-gray-50 p-1 rounded">
                                  <span className="font-medium">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                  <span className={`ml-2 ${log.status === "success" ? "text-green-500" : log.status === "error" ? "text-red-500" : "text-gray-500"}`}>
                                    {log.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={fetchEdgeFunctionLogs} 
                  disabled={isLoadingLogs}
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  {isLoadingLogs ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Carregar Logs
                    </>
                  )}
                </Button>
              </div>
              
              {edgeFunctionLogs.length > 0 ? (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="bg-gray-100 p-3 font-medium">
                    Logs da função Edge ({edgeFunctionLogs.length})
                  </div>
                  <div className="divide-y">
                    {edgeFunctionLogs.map((log, index) => (
                      <div key={index} className="p-3 hover:bg-gray-50">
                        <div className="flex justify-between">
                          <span className="font-medium">{log.message}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        
                        {log.details && (
                          <div className="mt-2 text-sm">
                            <pre className="bg-gray-50 p-2 rounded-md overflow-x-auto text-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-gray-500">
                  Nenhum log disponível. Clique em "Carregar Logs" para buscar os logs mais recentes.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="solucoes" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-blue-800 font-medium mb-2">Soluções para problemas comuns</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-700">Erro: "Unexpected end of JSON input"</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Este erro ocorre quando a função Edge retorna uma resposta JSON inválida ou vazia.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 ml-2">
                      <li>Verifique se a função "daily-meta-review" está publicada no Supabase</li>
                      <li>Tente republicar a função Edge no console do Supabase</li>
                      <li>Verifique os logs da função Edge para identificar o erro exato</li>
                      <li>Verifique se o corpo da requisição está bem formado e não vazio</li>
                      <li>Tente limpar o cache do navegador e fazer novo teste</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700">Erro: "Edge Function returned a non-2xx status code"</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Este erro indica que a função Edge está retornando um erro HTTP.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 ml-2">
                      <li>Verifique se a função está publicada e acessível</li>
                      <li>Verifique se você tem permissões para acessar a função</li>
                      <li>Consulte os logs da função Edge para entender o erro específico</li>
                      <li>Tente republicar a função Edge no console do Supabase</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700">Erro: "Timeout ao esperar resposta da função Edge"</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Este erro ocorre quando a função Edge não responde dentro do tempo limite.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-600 ml-2">
                      <li>Verifique se a função está online e acessível</li>
                      <li>Verifique se há problemas de rede ou firewall bloqueando a conexão</li>
                      <li>Verifique se a função Edge está funcionando corretamente no console do Supabase</li>
                      <li>Tente aumentar o timeout da requisição se o processamento for lento</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <h4 className="font-medium text-green-700">Dicas gerais para solução de problemas</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-green-600 ml-2 mt-2">
                      <li>Use o botão "Testar Conexão" para diagnosticar problemas</li>
                      <li>Verifique os logs da função Edge no console do Supabase</li>
                      <li>Republique a função Edge para garantir que está atualizada</li>
                      <li>Limpe o cache do navegador ou use uma guia anônima</li>
                      <li>Verifique se há problemas de rede ou firewall</li>
                      <li>Reinicie o servidor Supabase se possível</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
