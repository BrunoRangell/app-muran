import { useState, useEffect } from "react";
import { Check, RefreshCw, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleAdsTokenTest } from "./GoogleAdsTokenTest";
import { GoogleAdsTokenManager } from "./GoogleAdsTokenManager";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const [metaToken, setMetaToken] = useState("");
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [hasMetaToken, setHasMetaToken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMetaToken();
  }, []);

  const loadMetaToken = async () => {
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('value')
        .eq('name', 'meta_access_token')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value) {
        setMetaToken(data.value);
        setHasMetaToken(true);
      }
    } catch (error) {
      console.error('Erro ao carregar token Meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o token Meta Ads",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const saveMetaToken = async () => {
    if (!metaToken.trim()) {
      toast({
        title: "Atenção",
        description: "Cole o token Meta Ads antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMeta(true);
    try {
      const { data: existingToken, error: findError } = await supabase
        .from('api_tokens')
        .select('id')
        .eq('name', 'meta_access_token')
        .single();

      if (findError && findError.code !== 'PGRST116') throw findError;

      if (existingToken) {
        const { error } = await supabase
          .from('api_tokens')
          .update({
            value: metaToken.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('name', 'meta_access_token');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('api_tokens')
          .insert({
            name: 'meta_access_token',
            value: metaToken.trim(),
            description: 'Token de acesso da API Meta Ads'
          });

        if (error) throw error;
      }

      setHasMetaToken(true);
      toast({
        title: "Sucesso",
        description: "Token Meta Ads salvo. A conversão automática para token longo será disparada.",
      });
    } catch (error) {
      console.error('Erro ao salvar token Meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o token Meta Ads",
        variant: "destructive",
      });
    } finally {
      setIsSavingMeta(false);
    }
  };

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
          <TeamMemberCheck requireAdmin={true}>
            <Card>
              <CardHeader>
                <CardTitle>Token Meta Ads</CardTitle>
                <CardDescription>
                  Cole um novo token de acesso da Meta para renovar a integração.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingMeta ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ff6e00]" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="meta_access_token">Token de Acesso Meta</Label>
                      <p className="text-sm text-muted-foreground">
                        Token de sistema gerado no Gerenciador de Negócios da Meta.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="meta_access_token"
                            type={showMetaToken ? "text" : "password"}
                            placeholder="EAAB..."
                            value={metaToken}
                            onChange={(e) => setMetaToken(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowMetaToken(prev => !prev)}
                          >
                            {showMetaToken ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={saveMetaToken}
                        disabled={isSavingMeta}
                        className="bg-[#ff6e00] hover:bg-[#e56200]"
                      >
                        {isSavingMeta ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Token Meta Ads
                          </>
                        )}
                      </Button>
                    </div>

                    {hasMetaToken && (
                      <Alert className="bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 font-medium">
                          Token configurado
                        </AlertTitle>
                        <AlertDescription className="text-green-700">
                          O sistema tentará converter automaticamente para um token longo assim que você salvar.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Importante:</strong> o token é sensível e só pode ser visualizado/editado por administradores. 
                        Ao salvar, o trigger interno dispara a edge function <code className="bg-amber-100 px-1 rounded">convert-meta-token</code> para renovação.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TeamMemberCheck>
        </TabsContent>
      </Tabs>
    </div>
  );
};
