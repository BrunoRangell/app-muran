
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Loader, RefreshCw, Clock, Timer, Bell } from "lucide-react";
import { useGoogleAdsTokenManager } from "./hooks/useGoogleAdsTokenManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { GoogleAdsTokensSetupForm } from "@/components/daily-reviews/GoogleAdsTokensSetupForm";
import { GoogleAdsTokenLogs } from "@/components/daily-reviews/GoogleAdsTokenLogs";
import { useToast } from "@/hooks/use-toast";

interface TokenMetadata {
  status: string;
  token_type: string;
  last_refreshed?: string;
  last_checked?: string;
  expires_at?: string;
}

export const GoogleAdsTokenManager = () => {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [edgeFunctionEnabled, setEdgeFunctionEnabled] = useState<boolean>(false);
  const [healthCheckStatus, setHealthCheckStatus] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { tokenManager, isLoading, checkTokenHealth, refreshAccessToken } = useGoogleAdsTokenManager();
  const { toast } = useToast();

  // Atualizar status inicial
  useEffect(() => {
    const fetchInitialData = async () => {
      // Verificar saúde do token
      const health = await checkTokenHealth();
      setHealthCheckStatus(health?.status || "unknown");
      
      // Buscar metadados do token
      const { data } = await supabase
        .from("google_ads_token_metadata")
        .select("*")
        .eq("token_type", "access_token")
        .maybeSingle();
      
      if (data) {
        setMetadata(data);
      }
      
      // Verificar configurações de renovação automática
      const { data: config } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "google_ads_token_config")
        .maybeSingle();
      
      if (config?.value) {
        setAutoRefreshEnabled(config.value.auto_refresh_enabled || false);
        setEdgeFunctionEnabled(config.value.edge_function_enabled || false);
      }
    };
    
    fetchInitialData();
    
    // Atualizar tempo restante a cada minuto
    const intervalId = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Calcular tempo restante sempre que os metadados mudarem
  useEffect(() => {
    updateTimeRemaining();
  }, [metadata]);
  
  // Atualizar tempo restante de expiração
  const updateTimeRemaining = () => {
    if (metadata?.expires_at) {
      const expiresAt = new Date(metadata.expires_at).getTime();
      const now = new Date().getTime();
      const remainingMs = expiresAt - now;
      
      // Converter para minutos
      const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
      setTimeRemaining(remainingMinutes > 0 ? remainingMinutes : 0);
    } else {
      setTimeRemaining(null);
    }
  };

  // Salvar configurações de renovação automática
  const saveAutoRefreshConfig = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("system_configs")
        .upsert({
          key: "google_ads_token_config",
          value: { auto_refresh_enabled: enabled, edge_function_enabled }
        });
      
      if (error) throw error;
      
      setAutoRefreshEnabled(enabled);
      
      toast({
        title: enabled ? "Renovação automática ativada" : "Renovação automática desativada",
        description: enabled 
          ? "Os tokens serão renovados automaticamente quando estiverem próximos de expirar." 
          : "A renovação automática de tokens foi desativada."
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar configuração",
        description: "Não foi possível salvar a configuração de renovação automática.",
        variant: "destructive"
      });
    }
  };

  // Salvar configuração da edge function
  const saveEdgeFunctionConfig = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("system_configs")
        .upsert({
          key: "google_ads_token_config",
          value: { auto_refresh_enabled: autoRefreshEnabled, edge_function_enabled: enabled }
        });
      
      if (error) throw error;
      
      setEdgeFunctionEnabled(enabled);
      
      toast({
        title: enabled ? "Edge function ativada" : "Edge function desativada",
        description: enabled 
          ? "A edge function de verificação periódica de tokens foi ativada." 
          : "A edge function de verificação periódica de tokens foi desativada."
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar configuração",
        description: "Não foi possível salvar a configuração da edge function.",
        variant: "destructive"
      });
    }
  };

  // Teste manual da edge function
  const testEdgeFunction = async () => {
    try {
      const response = await supabase.functions.invoke('google-ads-token-check');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      toast({
        title: result.success ? "Edge function executada com sucesso" : "Erro na edge function",
        description: result.message
      });
      
      // Recarregar dados após o teste
      const health = await checkTokenHealth();
      setHealthCheckStatus(health?.status || "unknown");
      
      // Atualizar metadados
      const { data } = await supabase
        .from("google_ads_token_metadata")
        .select("*")
        .eq("token_type", "access_token")
        .maybeSingle();
      
      if (data) {
        setMetadata(data);
      }
    } catch (error) {
      console.error("Erro ao testar edge function:", error);
      toast({
        title: "Erro ao testar edge function",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleRefreshToken = async () => {
    try {
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        toast({
          title: "Token renovado com sucesso",
          description: "O token de acesso do Google Ads foi renovado manualmente."
        });
        
        // Atualizar metadados
        const { data } = await supabase
          .from("google_ads_token_metadata")
          .select("*")
          .eq("token_type", "access_token")
          .maybeSingle();
        
        if (data) {
          setMetadata(data);
          setHealthCheckStatus("valid");
        }
      } else {
        toast({
          title: "Erro na renovação",
          description: "Não foi possível renovar o token de acesso.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      toast({
        title: "Erro ao renovar token",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Não disponível";
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
  
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusMap: Record<string, { color: string, label: string }> = {
      'valid': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Válido' },
      'expired': { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Expirado' },
      'unknown': { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Desconhecido' },
      'error': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Erro' },
    };
    
    const styles = statusMap[status] || statusMap.unknown;
    
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.color}`}>
      {styles.label}
    </span>;
  };

  const getTimeRemainingText = () => {
    if (timeRemaining === null) return "Desconhecido";
    
    if (timeRemaining <= 0) return "Expirado";
    
    if (timeRemaining < 60) {
      return `${timeRemaining} minutos`;
    } else {
      const hours = Math.floor(timeRemaining / 60);
      const minutes = timeRemaining % 60;
      return `${hours} hora${hours !== 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  const getExpirationProgress = () => {
    if (timeRemaining === null) return 0;
    
    // Token de acesso do Google tem validade típica de 3600 segundos (60 minutos)
    const totalMinutes = 60;
    const progress = Math.max(0, Math.min(100, (timeRemaining / totalMinutes) * 100));
    return progress;
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Status do Token Google Ads</CardTitle>
            <CardDescription>Informações e gerenciamento de tokens de API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthCheckStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na configuração do token</AlertTitle>
                <AlertDescription>
                  Há um problema com a configuração do token Google Ads. 
                  Verifique se todos os tokens necessários estão configurados corretamente.
                </AlertDescription>
              </Alert>
            )}
            
            {healthCheckStatus === "expired" && (
              <Alert variant="warning" className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertTitle>Token expirado</AlertTitle>
                <AlertDescription>
                  O token de acesso está expirado. Clique em "Renovar agora" para gerar um novo.
                </AlertDescription>
              </Alert>
            )}
            
            {healthCheckStatus === "valid" && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Token válido</AlertTitle>
                <AlertDescription>
                  O token de acesso está válido e pode ser usado para chamadas à API.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                <div className="text-sm font-medium">Status atual:</div>
                <div className="text-sm text-right">{getStatusBadge(healthCheckStatus)}</div>
                
                <div className="text-sm font-medium">Última renovação:</div>
                <div className="text-sm text-right">{formatDate(metadata?.last_refreshed)}</div>
                
                <div className="text-sm font-medium">Última verificação:</div>
                <div className="text-sm text-right">{formatDate(metadata?.last_checked)}</div>
                
                <div className="text-sm font-medium">Expira em:</div>
                <div className="text-sm text-right">{formatDate(metadata?.expires_at)}</div>
              </div>
              
              {timeRemaining !== null && (
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      <span>Tempo restante:</span>
                    </div>
                    <span>{getTimeRemainingText()}</span>
                  </div>
                  <Progress 
                    value={getExpirationProgress()} 
                    className="h-2" 
                    indicatorClassName={timeRemaining < 10 ? "bg-orange-500" : "bg-green-500"}
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleRefreshToken}
                disabled={isLoading}
                className="bg-[#ff6e00] hover:bg-[#cc5800] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renovar agora
                  </>
                )}
              </Button>
              
              <Button
                onClick={testEdgeFunction}
                variant="outline"
                disabled={isLoading}
              >
                <Bell className="mr-2 h-4 w-4" />
                Testar função automática
              </Button>
              
              <GoogleAdsTokensSetupForm />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Configurações de renovação automática</h3>
              
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">Renovação automática</Label>
                  <p className="text-xs text-gray-500">
                    Renovar tokens automaticamente quando estiverem próximos de expirar
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={saveAutoRefreshConfig}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edge-function">Verificação periódica (Edge Function)</Label>
                  <p className="text-xs text-gray-500">
                    Verificar e renovar tokens periodicamente usando edge function
                  </p>
                </div>
                <Switch
                  id="edge-function"
                  checked={edgeFunctionEnabled}
                  onCheckedChange={saveEdgeFunctionConfig}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <GoogleAdsTokenLogs />
      </div>
    </div>
  );
};
