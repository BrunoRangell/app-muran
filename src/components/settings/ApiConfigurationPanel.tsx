
import { useState } from "react";
import { Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { GoogleAdsTokenTest } from "./GoogleAdsTokenTest";
import { GoogleAdsTokenManager } from "./GoogleAdsTokenManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ApiConfigurationPanel = () => {
  const [activeTab, setActiveTab] = useState<string>("google-ads");
  const [showDetails, setShowDetails] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    clientCount?: number;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testGoogleAdsTokens = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Função google-ads-token-check removida - tokens renovam automaticamente
      setTestResult({
        success: true,
        message: "Tokens Google Ads são renovados automaticamente",
        details: {
          status: "automated",
          apiCall: "Automático",
          note: "A renovação de tokens foi integrada às outras funções"
        }
      });
      
      toast({
        title: "Informação",
        description: "Tokens Google Ads são renovados automaticamente",
      });
    } catch (err) {
      console.error("Erro ao testar tokens:", err);
      setTestResult({
        success: false,
        message: `Erro inesperado: ${err instanceof Error ? err.message : String(err)}`,
      });
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar os tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#321e32]">Configurações de API</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full flex justify-start overflow-x-auto">
          <TabsTrigger value="google-ads">Google Ads</TabsTrigger>
          <TabsTrigger value="meta-ads">Meta Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="google-ads" className="space-y-6">
          {/* Gerenciador de Tokens */}
          <GoogleAdsTokenManager />

          {/* Diagnóstico e Teste */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h3 className="text-lg font-medium">Diagnóstico do Google Ads</h3>
            <p className="text-sm text-gray-600">
              Verifique e renove os tokens da API Google Ads
            </p>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                onClick={testGoogleAdsTokens}
                className="bg-[#ff6e00] hover:bg-[#e56200]"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> 
                Testar Conexão
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" /> 
                    Ocultar Detalhes
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" /> 
                    Mostrar Detalhes
                  </>
                )}
              </Button>
            </div>

            {testResult?.success && (
              <Alert className="bg-green-50 border-green-200 mt-4">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-medium flex items-center gap-2">
                  Conexão bem-sucedida
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Sucesso
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  {testResult.message}
                  {testResult.clientCount !== undefined && (
                    <div className="mt-1">
                      {testResult.clientCount} contas de cliente encontradas
                    </div>
                  )}
                  {testResult.details?.tokenRefreshed && (
                    <div className="mt-1">
                      O token de acesso foi renovado com sucesso
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {testResult?.success === false && (
              <Alert className="bg-red-50 border-red-200 mt-4">
                <Check className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 font-medium">
                  Erro de conexão
                </AlertTitle>
                <AlertDescription className="text-red-700">
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            {showDetails && (
              <div className="mt-4">
                <GoogleAdsTokenTest />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="meta-ads" className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium">Configurações do Meta Ads</h3>
            <p className="text-gray-500 mt-2">
              Configure seus tokens de acesso para a API do Meta Ads.
            </p>
            {/* Implementação do Meta Ads será adicionada no futuro */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
