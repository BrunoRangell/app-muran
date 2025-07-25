
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader, Zap, RefreshCw } from "lucide-react";
import { useMetaReviewService } from "@/components/common/hooks/useMetaReviewService";
import { ConnectionStatus } from "./auto-review/ConnectionStatus";
import { TroubleshootingGuide } from "./auto-review/TroubleshootingGuide";

export function AutoReviewSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoReviewEnabled, setIsAutoReviewEnabled] = useState(true);
  const [lastReviewTime, setLastReviewTime] = useState<string | null>(null);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
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
    
    const intervalId = setInterval(() => {
      loadSettings();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Abrir troubleshooting automaticamente quando houver um erro
  useEffect(() => {
    if (lastConnectionStatus === "error" && lastErrorMessage) {
      setIsTroubleshootingOpen(true);
    }
  }, [lastConnectionStatus, lastErrorMessage]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "last_batch_review_time")
        .maybeSingle();
      
      if (configData?.value) {
        setLastReviewTime(configData.value);
      }
      
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
      setIsAutoReviewEnabled(!isAutoReviewEnabled);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    }
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
            
            <ConnectionStatus lastConnectionStatus={lastConnectionStatus} />
            
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={testMetaReviewFunction}
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
          
          <TroubleshootingGuide 
            isOpen={isTroubleshootingOpen}
            onToggle={setIsTroubleshootingOpen}
          />
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-md">
            <h3 className="font-medium mb-1">Informações importantes</h3>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>As revisões automáticas são executadas a cada 6 minutos pelo cron</li>
              <li>Na interface, o contador executa a cada 3 minutos quando a aba estiver ativa</li>
              <li>Se você notar que as revisões não estão sendo executadas automaticamente, use o botão "Testar Conexão"</li>
              <li>Se o problema persistir após testar a conexão, verifique os logs de erro na interface de jobs</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
