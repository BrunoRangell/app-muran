
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useGoogleAdsTokenManager } from "./hooks/useGoogleAdsTokenManager";
import { CheckCircle, AlertCircle, Loader, Settings, RefreshCw, Clock, List } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const GoogleAdsTokensTest = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const { 
    isLoading, 
    refreshAccessToken,
    checkTokenHealth,
    getValidAccessToken,
    logTokenEvent
  } = useGoogleAdsTokenManager();

  const handleTestTokens = async () => {
    try {
      const healthInfo = await checkTokenHealth();
      setDebugInfo(healthInfo);
      setShowDebug(true);
      
      // Registrar evento de teste
      await logTokenEvent({
        event: 'check',
        status: healthInfo.status,
        message: 'Teste manual de token realizado',
        details: healthInfo
      });
      
      // Buscar logs mais recentes
      fetchRecentLogs();
    } catch (error) {
      console.error("Erro ao testar tokens:", error);
    }
  };

  const handleRefreshToken = async () => {
    try {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        setDebugInfo({
          ...debugInfo,
          status: 'valid',
          accessTokenValid: true,
          message: 'Token renovado com sucesso',
          refreshed: true
        });
      } else {
        setDebugInfo({
          ...debugInfo,
          message: 'Falha ao renovar token',
          refreshed: false
        });
      }
      
      // Atualizar os logs após a operação
      fetchRecentLogs();
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      setDebugInfo({
        ...debugInfo,
        message: `Erro ao renovar token: ${error instanceof Error ? error.message : String(error)}`,
        refreshed: false
      });
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const { data: recentLogs, error } = await supabase
        .from("google_ads_token_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        throw error;
      }
      
      setLogs(recentLogs || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  const handleCheckToken = async () => {
    try {
      const token = await getValidAccessToken();
      
      if (token) {
        setDebugInfo({
          status: 'valid',
          accessTokenValid: true,
          message: 'Token de acesso é válido'
        });
      } else {
        setDebugInfo({
          status: 'expired',
          accessTokenValid: false,
          message: 'Token de acesso está inválido ou expirado'
        });
      }
      
      // Buscar logs mais recentes
      fetchRecentLogs();
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      setDebugInfo({
        status: 'error',
        message: `Erro ao verificar token: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'valid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Válido' },
      'expired': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Expirado' },
      'unknown': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Desconhecido' },
      'refreshing': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Renovando' },
      'error': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Erro' },
    };
    
    const styles = statusMap[status] || statusMap.unknown;
    
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.color}`}>
      {styles.label}
    </span>;
  };

  const getEventIcon = (event: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'check': <CheckCircle className="h-4 w-4 text-blue-500" />,
      'refresh': <RefreshCw className="h-4 w-4 text-green-500" />,
      'error': <AlertCircle className="h-4 w-4 text-red-500" />,
      'use': <Clock className="h-4 w-4 text-purple-500" />
    };
    
    return iconMap[event] || <CheckCircle className="h-4 w-4" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Diagnóstico do Google Ads</CardTitle>
        <CardDescription>
          Teste a configuração e renovação dos tokens da API Google Ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleTestTokens} 
            disabled={isLoading}
            className="bg-[#ff6e00] hover:bg-[#cc5800] text-white"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar Tokens
              </>
            )}
          </Button>
          
          <Button
            onClick={handleRefreshToken}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Renovando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Renovar Token
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setShowDebug(!showDebug);
              if (!showDebug) handleTestTokens();
            }}
            className="border-[#ff6e00] text-[#ff6e00]"
          >
            <Settings className="mr-2 h-4 w-4" />
            {showDebug ? "Ocultar Detalhes" : "Mostrar Detalhes"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) fetchRecentLogs();
            }}
            className="border-[#321e32] text-[#321e32]"
          >
            <List className="mr-2 h-4 w-4" />
            {showLogs ? "Ocultar Logs" : "Mostrar Logs"}
          </Button>
        </div>

        {debugInfo && debugInfo.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na validação</AlertTitle>
            <AlertDescription>{debugInfo.message}</AlertDescription>
          </Alert>
        )}

        {debugInfo && debugInfo.status === "expired" && (
          <Alert variant="default" className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertTitle>Token expirado</AlertTitle>
            <AlertDescription>
              O token de acesso está expirado. Clique em "Renovar Token" para gerar um novo.
            </AlertDescription>
          </Alert>
        )}

        {debugInfo && debugInfo.status === "valid" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Token válido</AlertTitle>
            <AlertDescription>
              {debugInfo.refreshed 
                ? "Token de acesso renovado com sucesso." 
                : "O token de acesso está válido e pode ser usado para chamadas à API."}
            </AlertDescription>
          </Alert>
        )}

        {showDebug && debugInfo && (
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
              <TabsTrigger value="tokens" className="flex-1">Tokens</TabsTrigger>
              {debugInfo.apiCallError && (
                <TabsTrigger value="error" className="flex-1">Erro da API</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Informações de Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-semibold">Status:</span> 
                      {getStatusBadge(debugInfo.status || "unknown")}
                    </div>
                    {debugInfo.message && (
                      <div>
                        <span className="font-semibold">Mensagem:</span> {debugInfo.message}
                      </div>
                    )}
                    {debugInfo.accessTokenValid !== undefined && (
                      <div>
                        <span className="font-semibold">Token válido:</span> {debugInfo.accessTokenValid ? "Sim" : "Não"}
                      </div>
                    )}
                    {debugInfo.lastRefreshed && (
                      <div>
                        <span className="font-semibold">Última renovação:</span> {formatDate(debugInfo.lastRefreshed)}
                      </div>
                    )}
                    {debugInfo.expiresAt && (
                      <div>
                        <span className="font-semibold">Expira em:</span> {formatDate(debugInfo.expiresAt)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tokens">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Tokens Configurados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2 text-sm">
                      {debugInfo.tokensPresent && debugInfo.tokensPresent.map((token: string) => (
                        <li key={token} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {token}
                        </li>
                      ))}
                      {debugInfo.missingTokens && debugInfo.missingTokens.map((token: string) => (
                        <li key={token} className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                          {token} (ausente)
                        </li>
                      ))}
                      {debugInfo.missingOptional && (
                        <li className="flex items-center text-yellow-600">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                          {debugInfo.missingOptional} (opcional, mas necessário para API)
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            {debugInfo.apiCallError && (
              <TabsContent value="error">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Erro da API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs whitespace-pre-wrap overflow-auto bg-gray-100 p-3 rounded">
                        {typeof debugInfo.apiCallError === 'object' 
                          ? JSON.stringify(debugInfo.apiCallError, null, 2) 
                          : debugInfo.apiCallError}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}

        {showLogs && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Histórico de Operações</CardTitle>
              <CardDescription className="text-xs">
                Últimas 50 operações registradas com os tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {logs.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Nenhum log encontrado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(log.event_type)}
                            <span className="font-medium">{log.event_type.toUpperCase()}</span>
                            {getStatusBadge(log.token_status)}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-sm mt-1">{log.message}</p>
                        {log.details && (
                          <details className="mt-1">
                            <summary className="text-xs text-blue-500 cursor-pointer">Detalhes</summary>
                            <pre className="text-xs mt-1 bg-gray-50 p-1 rounded overflow-x-auto">
                              {log.details}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
