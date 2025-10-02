import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface IntegrationSelectorProps {
  integrations: {
    clickup: boolean;
    discord: boolean;
    drive: boolean;
  };
  onIntegrationsChange: (integrations: any) => void;
  clientId: string;
}

export const IntegrationSelector = ({
  integrations,
  onIntegrationsChange,
  clientId,
}: IntegrationSelectorProps) => {
  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ["onboarding-status", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const getStatusIcon = (status?: string) => {
    if (!status || status === "pending") return null;
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Verificando status das integrações...</span>
        </div>
      </Card>
    );
  }

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
              {onboardingStatus?.clickup_status && (
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(onboardingStatus.clickup_status)}
                  <span className="text-xs text-muted-foreground">
                    Status: {onboardingStatus.clickup_status}
                  </span>
                  {onboardingStatus.clickup_folder_id && (
                    <a
                      href={`https://app.clickup.com/${onboardingStatus.clickup_folder_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver projeto <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
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
              {onboardingStatus?.discord_status && (
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(onboardingStatus.discord_status)}
                  <span className="text-xs text-muted-foreground">
                    Status: {onboardingStatus.discord_status}
                  </span>
                  {onboardingStatus.discord_channel_link && (
                    <a
                      href={onboardingStatus.discord_channel_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver canal <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
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
              {onboardingStatus?.drive_status && (
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(onboardingStatus.drive_status)}
                  <span className="text-xs text-muted-foreground">
                    Status: {onboardingStatus.drive_status}
                  </span>
                  {onboardingStatus.drive_folder_link && (
                    <a
                      href={onboardingStatus.drive_folder_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ver pasta <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
