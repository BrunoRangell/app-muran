
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useGoogleTokenService } from "./hooks/useGoogleTokenService";
import { CheckCircle, AlertCircle, Loader, Settings, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const GoogleAdsTokensTest = () => {
  const [showDebug, setShowDebug] = useState(false);
  const { testGoogleTokens, isLoading, error, debugInfo } = useGoogleTokenService();

  const handleTestTokens = async () => {
    await testGoogleTokens();
    setShowDebug(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Diagnóstico do Google Ads</CardTitle>
        <CardDescription>
          Teste a configuração dos tokens da API Google Ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleTestTokens} 
            disabled={isLoading}
            className="bg-[#ff6e00] hover:bg-[#cc5800] text-white"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Testar Tokens
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowDebug(!showDebug)}
            className="border-[#ff6e00] text-[#ff6e00]"
          >
            <Settings className="mr-2 h-4 w-4" />
            {showDebug ? "Ocultar Detalhes" : "Mostrar Detalhes"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na validação</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && debugInfo && debugInfo.status === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Conexão bem-sucedida</AlertTitle>
            <AlertDescription>
              {debugInfo.tokenRefreshed 
                ? "Token de acesso renovado com sucesso." 
                : debugInfo.apiCallSuccess 
                  ? `API do Google Ads conectada! ${debugInfo.clientsFound} contas de cliente encontradas.`
                  : "Tokens verificados com sucesso."}
            </AlertDescription>
          </Alert>
        )}

        {!error && debugInfo && debugInfo.status === "warning" && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Configuração parcial</AlertTitle>
            <AlertDescription>
              {debugInfo.message}
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
                      <span className="font-semibold">Status:</span> {debugInfo.status || "N/A"}
                    </div>
                    {debugInfo.message && (
                      <div>
                        <span className="font-semibold">Mensagem:</span> {debugInfo.message}
                      </div>
                    )}
                    {debugInfo.apiCallSuccess !== undefined && (
                      <div>
                        <span className="font-semibold">Chamada à API:</span> {debugInfo.apiCallSuccess ? "Sucesso" : "Falha"}
                      </div>
                    )}
                    {debugInfo.clientsFound !== undefined && (
                      <div>
                        <span className="font-semibold">Clientes encontrados:</span> {debugInfo.clientsFound}
                      </div>
                    )}
                    {debugInfo.tokenRefreshed !== undefined && (
                      <div>
                        <span className="font-semibold">Token renovado:</span> {debugInfo.tokenRefreshed ? "Sim" : "Não"}
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
      </CardContent>
    </Card>
  );
};
