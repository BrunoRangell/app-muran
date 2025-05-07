
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function SettingsTab() {
  const { toast } = useToast();
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reviewTime, setReviewTime] = useState("09:00");
  const [reviewFrequency, setReviewFrequency] = useState("daily");

  const handleSaveSettings = () => {
    // Aqui implementaríamos a lógica para salvar as configurações
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Revisão Automática</CardTitle>
          <CardDescription>
            Configure como e quando as revisões automáticas devem ser executadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ativar Revisão Automática</h3>
              <p className="text-sm text-gray-500">
                Permitir que o sistema analise automaticamente os orçamentos.
              </p>
            </div>
            <Switch 
              checked={autoReviewEnabled} 
              onCheckedChange={setAutoReviewEnabled} 
            />
          </div>
          
          {autoReviewEnabled && (
            <div className="space-y-4 pt-2 pl-2 border-l-2 border-[#ff6e00]/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewTime">Horário da Revisão</Label>
                  <Input 
                    id="reviewTime" 
                    type="time" 
                    value={reviewTime} 
                    onChange={(e) => setReviewTime(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewFrequency">Frequência</Label>
                  <Select value={reviewFrequency} onValueChange={setReviewFrequency}>
                    <SelectTrigger id="reviewFrequency">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="workdays">Dias úteis</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="font-medium">Ativar Notificações</h3>
              <p className="text-sm text-gray-500">
                Receber alertas sobre orçamentos que precisam de ajuste.
              </p>
            </div>
            <Switch 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled} 
            />
          </div>
          
          <div className="pt-4">
            <Button onClick={handleSaveSettings} className="bg-[#ff6e00] hover:bg-[#ff6e00]/90">
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API e Integrações</CardTitle>
          <CardDescription>
            Configure as credenciais de acesso às plataformas de anúncios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaToken">Token do Meta Ads</Label>
            <Input id="metaToken" type="password" placeholder="••••••••••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleToken">Token do Google Ads</Label>
            <Input id="googleToken" type="password" placeholder="••••••••••••••••" />
          </div>
          <div className="pt-4">
            <Button variant="outline">Testar Conexão</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
