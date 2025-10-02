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
      <div className="flex items-center gap-3">
        <div className="p-3 bg-muran-primary/10 rounded-xl">
          <Settings2 className="h-7 w-7 text-muran-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark flex items-center gap-2">
            Onboarding de Cliente
            <Sparkles className="h-6 w-6 text-muran-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure automaticamente todas as integrações para o novo cliente
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-muran-primary/5 to-transparent">
          <CardTitle className="text-xl">Criar Novo Cliente</CardTitle>
          <CardDescription>
            Preencha as informações e inicie o processo automatizado
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Input do Nome */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-base font-medium">
              Nome do Cliente
            </Label>
            <Input
              id="companyName"
              placeholder="Digite o nome da empresa..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isOnboarding}
              className="h-12 text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && companyName.trim()) {
                  handleExecuteOnboarding();
                }
              }}
            />
          </div>

          {/* Layout Horizontal de Automação */}
          <div>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-muran-primary" />
                <h3 className="text-base font-semibold text-muran-dark">Fluxo de Automação</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Este processo será executado automaticamente na seguinte ordem:
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              {/* Step 1: Google Drive */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="flex flex-col gap-3 p-5 rounded-lg border bg-card shadow-sm">
                  <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center p-0 shrink-0 bg-muran-primary hover:bg-muran-primary self-start">
                    1
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <HardDrive className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-muran-dark">Google Drive</h4>
                      <p className="text-xs text-muted-foreground">
                        Pasta organizada
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muran-primary animate-pulse hidden md:block" />
                <ArrowRight className="w-6 h-6 text-muran-primary animate-pulse md:hidden rotate-90" />
              </div>

              {/* Step 2: Discord */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="flex flex-col gap-3 p-5 rounded-lg border bg-card shadow-sm">
                  <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center p-0 shrink-0 bg-muran-primary hover:bg-muran-primary self-start">
                    2
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-muran-dark">Discord</h4>
                      <p className="text-xs text-muted-foreground">
                        Canal privado
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-muran-primary animate-pulse hidden md:block" />
                <ArrowRight className="w-6 h-6 text-muran-primary animate-pulse md:hidden rotate-90" />
              </div>

              {/* Step 3: ClickUp */}
              <div className="w-full md:w-64 flex-shrink-0">
                <div className="flex flex-col gap-3 p-5 rounded-lg border bg-card shadow-sm">
                  <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center p-0 shrink-0 bg-muran-primary hover:bg-muran-primary self-start">
                    3
                  </Badge>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-muran-dark">ClickUp</h4>
                      <p className="text-xs text-muted-foreground">
                        Projeto completo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleExecuteOnboarding}
              disabled={isOnboarding || !companyName.trim()}
              className="w-full h-12 text-base gap-2 bg-gradient-to-r from-muran-primary to-muran-primary/80 hover:from-muran-primary/90 hover:to-muran-primary/70 shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="h-5 w-5" />
              {isOnboarding ? "Processando..." : "Criar Cliente e Executar Onboarding"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <OnboardingProgress isOpen={isOnboarding} />
    </div>
  );
}
