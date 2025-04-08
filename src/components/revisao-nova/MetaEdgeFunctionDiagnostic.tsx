
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Code, 
  Terminal,
  Info,
  Play
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Textarea } from "@/components/ui/textarea";

export function MetaEdgeFunctionDiagnostic() {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPublishingTest, setIsPublishingTest] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [deployLogs, setDeployLogs] = useState<string>("");
  const { toast } = useToast();

  // Função para verificar o status da função Edge
  const checkEdgeFunctionStatus = async () => {
    setIsCheckingStatus(true);
    setStatusResult(null);
    
    try {
      console.log("Verificando status da função Edge daily-meta-review...");
      
      // Primeiro, vamos verificar se há logs recentes da função
      const { data: logs, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "edge_function")
        .order("created_at", { ascending: false })
        .limit(10);
      
      // Agora vamos tentar um ping direto na função com mínimo payload
      const { data: pingResult, error: pingError } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: { method: "ping", timestamp: new Date().toISOString() }
        }
      );
      
      // Montar resultado do diagnóstico
      const result = {
        timestamp: new Date().toISOString(),
        functionName: "daily-meta-review",
        pingSuccess: !pingError,
        pingResponse: pingResult,
        pingError: pingError ? {
          message: pingError.message,
          name: pingError.name,
          status: (pingError as any).status || "unknown"
        } : null,
        recentLogs: logs || [],
        conclusion: !pingError ? "Função Edge parece estar funcionando!" : "Problema detectado com a função Edge",
        suggestion: pingError ? 
          pingError.message.includes("non-2xx status code") ? 
            "A função retornou um erro HTTP. Provavelmente há um erro na função ou ela não está lidando com a requisição corretamente." :
            pingError.message.includes("network") || pingError.message.includes("Failed to fetch") ?
              "Problemas de conectividade. A função pode não estar publicada ou acessível." :
              "Erro desconhecido. Verifique os logs para mais detalhes."
          : "Função parece funcional, mas verifique se ela está retornando os dados esperados."
      };
      
      setStatusResult(result);
      
      toast({
        title: result.pingSuccess ? "Função Edge respondeu com sucesso" : "Problema detectado na função Edge",
        description: result.suggestion,
        variant: result.pingSuccess ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao verificar status da função Edge:", error);
      
      setStatusResult({
        timestamp: new Date().toISOString(),
        functionName: "daily-meta-review",
        pingSuccess: false,
        pingError: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : "Unknown",
        },
        conclusion: "Erro ao verificar status da função Edge",
        suggestion: "Ocorreu um erro ao tentar diagnosticar a função. Verifique se você tem permissões de acesso."
      });
      
      toast({
        title: "Erro ao verificar função Edge",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Função para testar a publicação de uma função simples
  const publishTestFunction = async () => {
    setIsPublishingTest(true);
    setTestResponse(null);
    
    try {
      console.log("Tentando publicar função de teste...");
      
      // Criamos uma nova entrada de log para registrar a tentativa
      const { data: logEntry, error: logError } = await supabase
        .from("system_logs")
        .insert({
          event_type: "edge_function_test",
          message: "Tentativa de teste manual de publicação de função Edge",
          details: {
            timestamp: new Date().toISOString(),
            source: "ui_diagnostic_tool",
            action: "test_publish"
          }
        })
        .select()
        .single();
      
      if (logError) {
        throw new Error(`Erro ao criar log: ${logError.message}`);
      }
      
      // Este é um teste simples - na produção real, seria necessário acessar as APIs de gerenciamento
      // do Supabase para publicar uma função. Aqui estamos simulando o processo.
      
      // Tentamos invocar a função edge para ver se ela existe
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: { 
            test: true,
            method: "diagnosticTest",
            logId: logEntry.id,
            timestamp: new Date().toISOString()
          }
        }
      );
      
      const result = {
        timestamp: new Date().toISOString(),
        success: !testError,
        response: testResult,
        error: testError ? {
          message: testError.message,
          name: testError.name,
          status: (testError as any).status || "unknown"
        } : null,
        conclusion: !testError ? 
          "Função respondeu! Isso sugere que ela está publicada e acessível." : 
          "Função retornou erro. Isso pode indicar um problema com a função ou sua publicação."
      };
      
      setTestResponse(result);
      
      // Registramos o resultado do teste
      await supabase
        .from("system_logs")
        .update({
          message: `Teste de função Edge: ${result.success ? "Sucesso" : "Falha"}`,
          details: {
            ...logEntry.details,
            testResult: result
          }
        })
        .eq("id", logEntry.id);
      
      toast({
        title: result.success ? "Teste bem-sucedido" : "Falha no teste",
        description: result.conclusion,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao testar publicação de função:", error);
      
      setTestResponse({
        timestamp: new Date().toISOString(),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : "Unknown",
        },
        conclusion: "Erro ao testar função Edge"
      });
      
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsPublishingTest(false);
    }
  };

  // Função para testar se o payload está correto
  const testPayload = async () => {
    setIsCheckingStatus(true);
    try {
      console.log("Testando payload para função Edge...");
      
      // Criar um payload de teste válido
      const testPayload = {
        method: "ping",
        test: true,
        timestamp: new Date().toISOString(),
        _nocache: Math.random()
      };
      
      // Log do payload para debug
      console.log("Enviando payload:", JSON.stringify(testPayload));
      
      // Testar se o payload pode ser serializado
      const serializedPayload = JSON.stringify(testPayload);
      console.log("Tamanho do payload serializado:", serializedPayload.length, "bytes");
      
      // Enviar requisição
      const { data: result, error } = await supabase.functions.invoke(
        "daily-meta-review",
        {
          body: testPayload
        }
      );
      
      if (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
      
      console.log("Resposta recebida:", result);
      
      toast({
        title: "Teste de payload bem-sucedido",
        description: "O payload foi enviado e processado corretamente.",
      });
      
      setStatusResult({
        timestamp: new Date().toISOString(),
        functionName: "daily-meta-review",
        pingSuccess: true,
        pingResponse: result,
        conclusion: "Payload processado com sucesso!",
        payloadInfo: {
          size: serializedPayload.length,
          content: testPayload
        }
      });
    } catch (error) {
      console.error("Erro ao testar payload:", error);
      
      toast({
        title: "Erro no teste de payload",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      
      setStatusResult({
        timestamp: new Date().toISOString(),
        functionName: "daily-meta-review",
        pingSuccess: false,
        pingError: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : "Unknown",
        },
        conclusion: "Falha ao processar payload",
        suggestion: "Verifique se o payload está corretamente formatado e se a função está preparada para recebê-lo."
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Função para simular a busca de logs de implantação
  const fetchDeployLogs = async () => {
    setDeployLogs("Buscando logs de deploy...");
    
    try {
      // Simular busca de logs - em um ambiente real, seria necessário
      // acessar as APIs administrativas do Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar logs do sistema para possíveis erros de função Edge
      const { data: systemLogs, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("event_type", "edge_function")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (logsError) {
        throw logsError;
      }
      
      // Montar texto de logs
      let logsText = "=== Logs de Sistema para Funções Edge ===\n\n";
      
      if (systemLogs && systemLogs.length > 0) {
        systemLogs.forEach((log, index) => {
          logsText += `[${new Date(log.created_at).toLocaleString()}] ${log.message}\n`;
          if (log.details) {
            logsText += JSON.stringify(log.details, null, 2) + "\n\n";
          }
        });
      } else {
        logsText += "Nenhum log encontrado para funções Edge.\n";
      }
      
      logsText += "\n=== Sugestões de Solução ===\n\n";
      logsText += "1. Verifique se a função 'daily-meta-review' está publicada no console do Supabase\n";
      logsText += "2. Tente republicar a função\n";
      logsText += "3. Verifique se o código da função não contém erros\n";
      logsText += "4. Verifique os logs do Supabase para erros específicos da função\n";
      logsText += "5. Certifique-se de que a função esteja respondendo ao payload específico enviado\n";
      
      setDeployLogs(logsText);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      setDeployLogs(`Erro ao buscar logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Detalhado de Função Edge</CardTitle>
          <CardDescription>
            Ferramentas avançadas para diagnosticar problemas com a função Edge Meta Review
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="status">Status da Função</TabsTrigger>
              <TabsTrigger value="teste">Teste de Diagnóstico</TabsTrigger>
              <TabsTrigger value="payload">Teste de Payload</TabsTrigger>
              <TabsTrigger value="logs">Logs de Deploy</TabsTrigger>
              <TabsTrigger value="solucao">Solução para non-2xx</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={checkEdgeFunctionStatus} 
                  disabled={isCheckingStatus}
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Verificar Status da Função
                    </>
                  )}
                </Button>
              </div>
              
              {statusResult && (
                <div className="mt-4 space-y-4">
                  <Alert variant={statusResult.pingSuccess ? "default" : "destructive"}>
                    {statusResult.pingSuccess ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{statusResult.conclusion}</AlertTitle>
                    <AlertDescription>{statusResult.suggestion}</AlertDescription>
                  </Alert>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Detalhes do diagnóstico:</h3>
                    
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Função testada:</span> {statusResult.functionName}
                      </div>
                      
                      <div>
                        <span className="font-medium">Status do ping:</span> {statusResult.pingSuccess ? "Sucesso" : "Falha"}
                      </div>
                      
                      {statusResult.pingError && (
                        <div className="bg-red-50 p-3 rounded-md border border-red-200">
                          <span className="font-medium text-red-600">Erro:</span>
                          <div className="text-red-600">
                            <div>{statusResult.pingError.message}</div>
                            {statusResult.pingError.status && (
                              <div>Status HTTP: {statusResult.pingError.status}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {statusResult.pingResponse && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                          <span className="font-medium text-green-600">Resposta:</span>
                          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                            {JSON.stringify(statusResult.pingResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {statusResult.payloadInfo && (
                        <div>
                          <span className="font-medium">Tamanho do payload:</span> {statusResult.payloadInfo.size} bytes
                          <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(statusResult.payloadInfo.content, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <Alert className="bg-blue-50 border-blue-200 mt-4">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Problemas comuns e soluções</AlertTitle>
                <AlertDescription className="text-blue-600 text-sm">
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>
                      <span className="font-medium">Edge Function returned a non-2xx status code</span>: 
                      A função está retornando um erro HTTP. Verifique os logs da função no Console do Supabase.
                    </li>
                    <li>
                      <span className="font-medium">Failed to fetch</span>: 
                      A função pode não estar publicada ou há problemas de conexão.
                    </li>
                    <li>
                      <span className="font-medium">Unexpected end of JSON input</span>: 
                      A função está retornando um JSON inválido. Verifique o código da função.
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="teste" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={publishTestFunction} 
                  disabled={isPublishingTest}
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  {isPublishingTest ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Testar Disponibilidade da Função
                    </>
                  )}
                </Button>
              </div>
              
              {testResponse && (
                <div className="mt-4 space-y-4">
                  <Alert variant={testResponse.success ? "default" : "destructive"}>
                    {testResponse.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{testResponse.success ? "Teste bem-sucedido" : "Falha no teste"}</AlertTitle>
                    <AlertDescription>{testResponse.conclusion}</AlertDescription>
                  </Alert>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Detalhes do teste:</h3>
                    
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Status do teste:</span> {testResponse.success ? "Sucesso" : "Falha"}
                      </div>
                      
                      <div>
                        <span className="font-medium">Timestamp:</span> {new Date(testResponse.timestamp).toLocaleString()}
                      </div>
                      
                      {testResponse.error && (
                        <div className="bg-red-50 p-3 rounded-md border border-red-200">
                          <span className="font-medium text-red-600">Erro:</span>
                          <div className="text-red-600">
                            <div>{testResponse.error.message}</div>
                            {testResponse.error.status && (
                              <div>Status HTTP: {testResponse.error.status}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {testResponse.response && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                          <span className="font-medium text-green-600">Resposta:</span>
                          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                            {JSON.stringify(testResponse.response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mt-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Como republicar a função Edge:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Acesse o console do Supabase</li>
                  <li>Navegue até a seção "Edge Functions"</li>
                  <li>Encontre a função "daily-meta-review"</li>
                  <li>Clique em "Deploy" para republicar a função</li>
                  <li>Verifique se não há erros durante a publicação</li>
                  <li>Teste novamente após a republicação</li>
                </ol>
              </div>
            </TabsContent>
            
            <TabsContent value="payload" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={testPayload} 
                  disabled={isCheckingStatus}
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Testar Payload JSON
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700">Teste de formato de payload</AlertTitle>
                  <AlertDescription className="text-blue-600 text-sm">
                    Este teste verifica se a função aceita um payload JSON válido. 
                    É útil para identificar problemas de serialização ou formato de dados.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Payload de teste:</h3>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto">
{`{
  "method": "ping",
  "test": true,
  "timestamp": "${new Date().toISOString()}",
  "_nocache": ${Math.random()}
}`}
                  </pre>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Problemas comuns com payload:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                    <li>Payload muito grande (limite do Supabase)</li>
                    <li>JSON malformado ou com erros de sintaxe</li>
                    <li>Campos obrigatórios ausentes no payload</li>
                    <li>Referências circulares no objeto JSON</li>
                    <li>Tipos de dados incompatíveis com a expectativa da função</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={fetchDeployLogs} 
                  className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Buscar Logs do Sistema
                </Button>
              </div>
              
              <div className="mt-4">
                <Textarea 
                  value={deployLogs} 
                  onChange={() => {}} // Somente leitura
                  className="font-mono text-xs h-[300px]" 
                />
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700">Dica para logs completos</AlertTitle>
                <AlertDescription className="text-blue-600 text-sm">
                  Para ver os logs completos da função Edge, acesse o Console do Supabase, 
                  navegue até Edge Functions e clique em "Logs" para a função "daily-meta-review".
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="solucao" className="space-y-4">
              <div className="bg-green-50 p-5 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800 mb-3">Solução para "Edge Function returned a non-2xx status code"</h3>
                
                <div className="space-y-4 text-sm text-green-700">
                  <p>
                    Este erro ocorre quando a função Edge retorna um código de status HTTP que não está no intervalo 2xx (sucesso).
                    Geralmente indica problemas na função Edge ou em como ela está processando a requisição.
                  </p>
                  
                  <div>
                    <h4 className="font-medium mb-1">Passos para solução:</h4>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Verifique se a função "daily-meta-review" está publicada no console do Supabase</li>
                      <li>Tente republicar a função para garantir que a versão mais recente está ativa</li>
                      <li>Examine os logs da função no Console do Supabase para identificar erros específicos</li>
                      <li>Verifique se a função tem um tratamento de erro adequado e retorna status 2xx mesmo com falhas internas</li>
                      <li>Certifique-se de que a função está lidando com os mesmos payloads que estão sendo enviados</li>
                      <li>Verifique se a função possui tratamento para requisições OPTIONS (CORS)</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Problemas comuns que causam status non-2xx:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Erros não tratados na função que causam falhas 500</li>
                      <li>Configuração incorreta de CORS causando erros 403</li>
                      <li>Payload inválido ou incompatível com o que a função espera (erro 400)</li>
                      <li>Função não publicada ou desativada (erro 404)</li>
                      <li>Variáveis de ambiente necessárias não configuradas na função</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-3 rounded-md border border-green-100">
                    <h4 className="font-medium mb-1">Exemplo de código para garantir resposta 2xx mesmo com erros:</h4>
                    <pre className="text-xs overflow-auto p-2 bg-gray-50 rounded">
{`// Exemplo de estrutura robusta para função Edge
serve(async (req) => {
  // Adicionar cabeçalhos CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Processar a requisição
    const data = await req.json();
    
    // Lógica principal aqui...
    
    return new Response(
      JSON.stringify({ success: true, data: resultado }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    
    // Retornar erro com status 200 para evitar o erro "non-2xx status code"
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Importante: Verificar credenciais</AlertTitle>
                <AlertDescription className="text-sm">
                  Certifique-se de que a função Edge tem acesso às credenciais necessárias 
                  (como tokens de acesso a APIs externas) e que elas estão configuradas 
                  corretamente nas variáveis de ambiente da função.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
