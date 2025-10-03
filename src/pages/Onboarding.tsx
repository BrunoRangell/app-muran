import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingResult } from "@/components/onboarding/OnboardingResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Play, Sparkles, FolderKanban, MessageSquare, HardDrive, ArrowRight, Zap } from "lucide-react";

export default function Onboarding() {
  const [companyName, setCompanyName] = useState<string>("");
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);
  const { toast } = useToast();

  // Todas as integrações são obrigatórias
  const integrations = {
    clickup: true,
    discord: true,
    drive: true,
  };

  const handleExecuteOnboarding = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Nome do cliente obrigatório",
        description: "Por favor, digite o nome do cliente antes de continuar.",
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
  };

  if (onboardingResult) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
        <OnboardingResult 
          result={onboardingResult} 
          onClose={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Onboarding de Cliente
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure automaticamente todas as integrações para o novo cliente
        </p>
      </div>

      {/* Main Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-5">
          <CardTitle className="text-lg font-semibold">Criar Novo Cliente</CardTitle>
          <CardDescription className="text-sm">
            Preencha as informações e inicie o processo automatizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input do Nome */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Nome do Cliente
            </Label>
            <Input
              id="companyName"
              placeholder="Digite o nome da empresa..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isOnboarding}
              className="h-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && companyName.trim()) {
                  handleExecuteOnboarding();
                }
              }}
            />
          </div>

          {/* Layout Horizontal de Automação */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Fluxo de Automação</h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0">
              {/* Step 1: Google Drive */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="relative flex flex-col gap-2.5 p-4 rounded-lg border bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shadow">
                    1
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <HardDrive className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Google Drive</h4>
                      <p className="text-xs text-muted-foreground">
                        Pasta organizada
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center justify-center my-1 md:my-0 md:mx-2 rotate-90 md:rotate-0">
                <div className="w-12 md:w-16 h-px border-t-2 border-dashed border-border"></div>
              </div>

              {/* Step 2: Discord */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="relative flex flex-col gap-2.5 p-4 rounded-lg border bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shadow">
                    2
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Discord</h4>
                      <p className="text-xs text-muted-foreground">
                        Canal privado
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex items-center justify-center my-1 md:my-0 md:mx-2 rotate-90 md:rotate-0">
                <div className="w-12 md:w-16 h-px border-t-2 border-dashed border-border"></div>
              </div>

              {/* Step 3: ClickUp */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="relative flex flex-col gap-2.5 p-4 rounded-lg border bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute -top-2 -left-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold shadow">
                    3
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">ClickUp</h4>
                      <p className="text-xs text-muted-foreground">
                        Projeto completo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/80 text-center mt-4">
              Todas as integrações serão criadas automaticamente
            </p>
          </div>

          {/* Botão de Ação */}
          <div className="pt-2">
            <Button
              onClick={handleExecuteOnboarding}
              disabled={isOnboarding || !companyName.trim()}
              className="w-full h-11 text-sm gap-2 shadow-sm hover:shadow transition-shadow"
            >
              <Play className="h-4 w-4" />
              {isOnboarding ? "Processando..." : "Criar Cliente e Executar Onboarding"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <OnboardingProgress isOpen={isOnboarding} />
    </div>
  );
}
