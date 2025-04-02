
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader, CheckCircle, AlertCircle, Trash, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const GoogleAdsTokensTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [accountCount, setAccountCount] = useState(0);
  const [expandDetails, setExpandDetails] = useState(false);
  const [configuredTokens, setConfiguredTokens] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("api_tokens")
        .select("name")
        .or('name.ilike.google_ads_%');
      
      if (error) throw error;
      
      const tokenNames = data.map(token => token.name);
      setConfiguredTokens(tokenNames);
      
      return tokenNames;
    } catch (error) {
      console.error("Erro ao buscar tokens:", error);
      return [];
    }
  };

  const testTokens = async () => {
    setIsLoading(true);
    setTestResult(null);
    setConnected(false);
    setAccountCount(0);
    
    try {
      // Primeiro buscar os tokens configurados
      await fetchTokens();
      
      // Verificar tokens
      const { data, error } = await supabase.functions.invoke('google-ads-token-check', {
        body: { 
          manual: true,
          test: true,
          timestamp: new Date().toISOString()
        }
      });
      
      if (error) throw new Error(`Erro ao testar tokens: ${error.message}`);
      
      setTestResult(data);
      
      if (data.success) {
        // Se o teste foi bem sucedido e retornou informações sobre contas
        if (data.customerCount !== undefined) {
          setConnected(true);
          setAccountCount(data.customerCount);
          
          toast({
            title: "Conexão bem-sucedida",
            description: `API do Google Ads conectada! ${data.customerCount} contas de cliente encontradas.`
          });
        } else {
          // Token é válido mas não testamos conexão com a API
          toast({
            title: "Token válido",
            description: "Token de acesso é válido, mas não foram recuperadas informações de contas."
          });
        }
      } else {
        toast({
          title: "Problema na conexão",
          description: data.message || "Não foi possível conectar à API do Google Ads.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao testar tokens:", error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao testar tokens"
      });
      
      toast({
        title: "Erro ao testar tokens",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-token-check', {
        body: { 
          manual: true,
          forceRefresh: true,
          timestamp: new Date().toISOString()
        }
      });
      
      if (error) throw new Error(`Erro ao renovar token: ${error.message}`);
      
      setTestResult(data);
      
      if (data.success && data.refreshed) {
        toast({
          title: "Token renovado com sucesso",
          description: `Token renovado e válido por ${Math.floor((data.expires_in || 3600) / 60)} minutos.`
        });
        
        // Testar novamente para verificar a conexão com as contas
        setTimeout(() => testTokens(), 1000);
      } else {
        toast({
          title: data.success ? "Tokens já estão válidos" : "Erro na renovação",
          description: data.message || "Verifique os logs para mais detalhes.",
          variant: data.success ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      
      toast({
        title: "Erro ao renovar token",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Diagnóstico do Google Ads</CardTitle>
        <CardDescription>
          Teste a configuração dos tokens da API Google Ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={testTokens} 
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
                Testar Tokens
              </>
            )}
          </Button>
          
          {testResult && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExpandDetails(!expandDetails)}
                className="w-max self-end"
              >
                {expandDetails ? "Ocultar Detalhes" : "Mostrar Detalhes"}
              </Button>
              
              {testResult.success ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Conexão bem-sucedida</AlertTitle>
                  <AlertDescription>
                    {connected 
                      ? `API do Google Ads conectada! ${accountCount} contas de cliente encontradas.` 
                      : "Os tokens estão válidos e configurados corretamente."}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Problema na conexão</AlertTitle>
                  <AlertDescription>
                    {testResult.message || "Erro ao conectar com a API do Google Ads."}
                  </AlertDescription>
                </Alert>
              )}
              
              {expandDetails && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Detalhes</h4>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tokens</h4>
                    <div className="bg-gray-50 rounded-md p-3">
                      <h5 className="text-sm font-medium mb-2">Tokens Configurados</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {configuredTokens.map(token => (
                          <li key={token} className="text-sm">
                            {token}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-4 flex gap-2">
                        <Button 
                          onClick={refreshToken} 
                          size="sm" 
                          disabled={isLoading}
                          className="bg-[#ff6e00] hover:bg-[#cc5800] text-white"
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Renovar Token
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
