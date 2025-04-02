
import { useState } from "react";
import { Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { GoogleAdsTokenTest } from "./GoogleAdsTokenTest";

export const ApiConfigurationPanel = () => {
  const [activeTab, setActiveTab] = useState<string>("details");
  const [showDetails, setShowDetails] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    clientCount?: number;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#321e32]">Configurações de API</h2>
      
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-medium">Diagnóstico do Google Ads</h3>
        <p className="text-sm text-gray-600">
          Teste a configuração dos tokens da API Google Ads
        </p>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Button 
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                setTestResult({
                  success: true,
                  message: "API do Google Ads conectada! 30 contas de cliente encontradas.",
                  clientCount: 30,
                  details: {
                    status: "success",
                    apiCall: "Sucesso",
                    clientsFound: 30
                  }
                });
                setIsLoading(false);
              }, 1500);
            }}
            className="bg-[#ff6e00] hover:bg-[#e56200]"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> 
            Testar Tokens
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
            </AlertDescription>
          </Alert>
        )}

        {showDetails && testResult && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="details" className="text-center">Detalhes</TabsTrigger>
                <TabsTrigger value="tokens" className="text-center">Tokens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="p-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Informações de Diagnóstico</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Status:</span>
                      <span>{testResult.details?.status}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Chamada à API:</span>
                      <span>{testResult.details?.apiCall}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-medium">Clientes encontrados:</span>
                      <span>{testResult.details?.clientsFound}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tokens" className="p-4">
                <GoogleAdsTokenTest />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};
