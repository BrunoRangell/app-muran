
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export function SettingsTabV2() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoReviewSchedule, setAutoReviewSchedule] = useState("09:00");

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // Simulação de salvamento de configurações
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
          <CardDescription>
            Configure as opções gerais do sistema de revisão diária
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Revisão automática</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar revisão automática diária de clientes
                </p>
              </div>
              <Switch
                checked={autoReviewEnabled}
                onCheckedChange={setAutoReviewEnabled}
              />
            </div>

            {autoReviewEnabled && (
              <div className="ml-6 border-l-2 pl-6 border-gray-100 space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="autoReviewTime">Horário da revisão</Label>
                  <Input
                    id="autoReviewTime"
                    type="time"
                    value={autoReviewSchedule}
                    onChange={(e) => setAutoReviewSchedule(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando clientes precisarem de ajustes
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveSettings} 
            disabled={isLoading}
            className="bg-[#ff6e00] hover:bg-[#e66200]"
          >
            {isLoading ? "Salvando..." : "Salvar configurações"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico do Sistema</CardTitle>
          <CardDescription>
            Verifique o estado dos serviços associados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>API Meta Ads</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>API Google Ads</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Job de Sincronização</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Pendente
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
