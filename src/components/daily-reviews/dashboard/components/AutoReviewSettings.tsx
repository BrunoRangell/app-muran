
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader, Clock, CheckCircle2, XCircle, Zap, RefreshCw } from "lucide-react";
import { useMetaReviewService } from "@/components/revisao-nova/hooks/useMetaReviewService";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AutoReviewSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoReviewEnabled, setIsAutoReviewEnabled] = useState(true);
  const [lastReviewTime, setLastReviewTime] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    testMetaReviewFunction,
    lastConnectionStatus,
    lastErrorMessage,
    resetConnectionStatus,
    isLoading: isTesting,
  } = useMetaReviewService();

  useEffect(() => {
    loadSettings();
    
    // Configurar intervalo para atualizar a cada minuto
    const intervalId = setInterval(() => {
      loadSettings();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Obter informações sobre a última revisão em lote
      const { data: configData } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
      
      if (configData?.value) {
        setLastReviewTime(configData.value);
      }
      
      // Obter configuração de revisão automática
      const { data: autoReviewConfig } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "auto_review_enabled")
        .maybeSingle();
      
      if (autoReviewConfig?.value !== undefined) {
        setIsAutoReviewEnabled(autoReviewConfig.value === "true");
      }
      
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoReview = async () => {
    try {
      const newValue = !isAutoReviewEnabled;
      setIsAutoReviewEnabled(newValue);
      
      // Verificar se já existe uma configuração
      const { data: existingConfig } = await supabase
        .from("system_configs")
        .select("id")
        .eq("key", "auto_review_enabled")
        .maybeSingle();
      
      if (existingConfig) {
        await supabase
          .from("system_configs")
          .update({ value: newValue.toString() })
          .eq("id", existingConfig.id);
      } else {
        await supabase
          .from("system_configs")
          .insert({
            key: "auto_review_enabled",
            value: newValue.toString()
          });
      }
      
      toast({
        title: newValue ? "Revisão automática ativada" : "Revisão automática desativada",
        description: newValue 
          ? "As revisões automáticas serão executadas conforme programado." 
          : "As revisões automáticas foram desativadas.",
      });
      
    } catch (error) {
      console.error("Erro ao alterar configuração:", error);
      setIsAutoReviewEnabled(!isAutoReviewEnabled); // Reverter mudança em caso de erro
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    await testMetaReviewFunction();
  };

  const handleReset = () => {
    resetConnectionStatus();
    toast({
      title: "Status de conexão resetado",
      description: "O status da conexão foi reiniciado.",
    });
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Revisão Automática</CardTitle>
        <CardDescription>
          Gerencie as configurações de revisão automática dos clientes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="auto-review" className="text-base">Revisão automática</Label>
              <p className="text-sm text-gray-500">
                Quando ativada, as revisões serão executadas automaticamente conforme programado
              </p>
            </div>
            <Switch
              id="auto-review"
              checked={isAutoReviewEnabled}
              onCheckedChange={toggleAutoReview}
              disabled={isLoading}
            />
          </div>
          
          <div className="border rounded-md p-4 space-y-3">
            <h3 className="font-medium">Status da Conexão</h3>
            
            <div className="flex items-center space-x-2">
              {!lastConnectionStatus && (
                <div className="text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Status desconhecido</span>
                </div>
              )}
              
              {lastConnectionStatus === "success" && (
                <div className="text-green-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span>Conectado e funcionando</span>
                </div>
              )}
              
              {lastConnectionStatus === "error" && (
                <div className="text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Problema de conexão detectado</span>
                </div>
              )}
            </div>
            
            {lastConnectionStatus === "error" && lastErrorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription className="text-xs">{lastErrorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={testConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
              
              {lastConnectionStatus && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resetar Status
                </Button>
              )}
            </div>
          </div>
          
          {lastReviewTime && (
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Última revisão em lote</h3>
              <p className="text-sm">
                {formatDateTime(lastReviewTime)}
              </p>
            </div>
          )}
          
          <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
            <h3 className="font-medium mb-1">Informações importantes</h3>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>As revisões automáticas são executadas a cada 6 minutos pelo cron</li>
              <li>Na interface, o contador executa a cada 3 minutos quando a aba estiver ativa</li>
              <li>Se você notar que as revisões não estão sendo executadas automaticamente, use o botão "Testar Conexão"</li>
              <li>Se o problema persistir após testar a conexão, verifique os logs de erro na interface de jobs</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md">
            <h3 className="font-medium mb-1">Solução de problemas</h3>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Se aparecer "Problema de conexão detectado", teste a conexão usando o botão acima</li>
              <li>Verifique se a função Edge "daily-meta-review" está publicada no Supabase</li>
              <li>Caso a interface não consiga se conectar, a função Meta pode estar desativada ou com erro</li>
              <li>Tente reiniciar o navegador ou limpar o cache em caso de problemas persistentes</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
