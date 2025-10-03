import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface IntegrationSelectorProps {
  integrations: {
    clickup: boolean;
    discord: boolean;
    drive: boolean;
  };
  onIntegrationsChange: (integrations: any) => void;
}

export const IntegrationSelector = ({
  integrations,
  onIntegrationsChange,
}: IntegrationSelectorProps) => {

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Integrações Automáticas</Label>
      
      <Card className="p-4 space-y-4">
        {/* ClickUp */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              id="clickup"
              checked={integrations.clickup}
              onCheckedChange={(checked) =>
                onIntegrationsChange({ ...integrations, clickup: checked })
              }
            />
            <div className="space-y-1 flex-1">
              <Label htmlFor="clickup" className="cursor-pointer font-medium">
                ClickUp - Criar projeto
              </Label>
              <p className="text-sm text-muted-foreground">
                Cria automaticamente um projeto no ClickUp para organização de tarefas
              </p>
            </div>
          </div>
        </div>

        {/* Discord */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              id="discord"
              checked={integrations.discord}
              onCheckedChange={(checked) =>
                onIntegrationsChange({ ...integrations, discord: checked })
              }
            />
            <div className="space-y-1 flex-1">
              <Label htmlFor="discord" className="cursor-pointer font-medium">
                Discord - Criar canal
              </Label>
              <p className="text-sm text-muted-foreground">
                Cria um canal privado no Discord para comunicação com o cliente
              </p>
            </div>
          </div>
        </div>

        {/* Google Drive */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              id="drive"
              checked={integrations.drive}
              onCheckedChange={(checked) =>
                onIntegrationsChange({ ...integrations, drive: checked })
              }
            />
            <div className="space-y-1 flex-1">
              <Label htmlFor="drive" className="cursor-pointer font-medium">
                Google Drive - Criar pasta
              </Label>
              <p className="text-sm text-muted-foreground">
                Cria uma pasta organizada no Google Drive para armazenar arquivos do cliente
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
