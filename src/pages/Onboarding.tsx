import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSelector } from "@/components/onboarding/ClientSelector";
import { IntegrationSelector } from "@/components/onboarding/IntegrationSelector";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingResult } from "@/components/onboarding/OnboardingResult";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [integrations, setIntegrations] = useState({
    clickup: false,
    discord: false,
    drive: false,
  });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleExecuteOnboarding = async () => {
    if (!selectedClientId) {
      toast({
        title: "Cliente não selecionado",
        description: "Por favor, selecione um cliente antes de executar o onboarding.",
        variant: "destructive",
      });
      return;
    }

    const hasIntegrations = Object.values(integrations).some(v => v);
    if (!hasIntegrations) {
      toast({
        title: "Nenhuma integração selecionada",
        description: "Selecione pelo menos uma integração para executar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsOnboarding(true);

      const { data, error } = await supabase.functions.invoke("orchestrate-client-onboarding", {
        body: {
          clientId: selectedClientId,
          integrations,
        },
      });

      if (error) throw error;

      setOnboardingResult(data);
      
      toast({
        title: "Onboarding concluído",
        description: "As integrações foram executadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao executar onboarding:", error);
      setOnboardingResult({
        success: false,
        error: error.message || "Erro ao processar onboarding",
      });
      toast({
        title: "Erro no onboarding",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleReset = () => {
    setOnboardingResult(null);
    setSelectedClientId("");
    setIntegrations({
      clickup: false,
      discord: false,
      drive: false,
    });
  };

  if (onboardingResult) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <OnboardingResult
          result={onboardingResult}
          onClose={handleReset}
          onNewClient={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-3xl">🔧 Onboarding - Automações de Integração</CardTitle>
              <CardDescription>
                Execute automações de integração (ClickUp, Discord, Google Drive) para clientes existentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientSelect={setSelectedClientId}
          />

          {selectedClientId && (
            <>
              <IntegrationSelector
                integrations={integrations}
                onIntegrationsChange={setIntegrations}
                clientId={selectedClientId}
              />

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExecuteOnboarding}
                  disabled={isOnboarding}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Executar Onboarding
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OnboardingProgress isOpen={isOnboarding} />
    </div>
  );
}
