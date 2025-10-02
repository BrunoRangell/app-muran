import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationSelector } from "@/components/onboarding/IntegrationSelector";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingResult } from "@/components/onboarding/OnboardingResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [companyName, setCompanyName] = useState<string>("");
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
    if (!companyName.trim()) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Por favor, digite o nome do cliente antes de continuar.",
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

      // 1. Criar o cliente primeiro
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_name: companyName.trim(),
          status: "active",
          contract_value: 0,
          first_payment_date: new Date().toISOString(),
          payment_type: "pre",
          contact_name: "",
          contact_phone: "",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Executar as automações de onboarding
      const { data, error } = await supabase.functions.invoke("orchestrate-client-onboarding", {
        body: {
          clientId: newClient.id,
          integrations,
        },
      });

      if (error) throw error;

      setOnboardingResult(data);
      
      toast({
        title: "Cliente criado e onboarding concluído",
        description: "O cliente foi criado e as integrações foram executadas com sucesso.",
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
    setCompanyName("");
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
              <CardTitle className="text-3xl">🎯 Novo Cliente - Onboarding Completo</CardTitle>
              <CardDescription>
                Crie um novo cliente e execute automaticamente as integrações com ClickUp, Discord e Google Drive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome do Cliente</Label>
            <Input
              id="companyName"
              placeholder="Digite o nome da empresa do cliente"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isOnboarding}
            />
          </div>

          <IntegrationSelector
            integrations={integrations}
            onIntegrationsChange={setIntegrations}
          />

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isOnboarding}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteOnboarding}
              disabled={isOnboarding || !companyName.trim()}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Criar Cliente e Executar Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>

      <OnboardingProgress isOpen={isOnboarding} />
    </div>
  );
}
