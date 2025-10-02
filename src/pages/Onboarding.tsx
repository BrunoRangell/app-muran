import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingResult } from "@/components/onboarding/OnboardingResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Play, Sparkles, FolderKanban, MessageSquare, HardDrive } from "lucide-react";

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

          {/* Cards das Integrações */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              INTEGRAÇÕES AUTOMÁTICAS
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Google Drive */}
              <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 transition-all hover:shadow-md hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HardDrive className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-muran-dark">Google Drive</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pasta organizada para documentos do cliente
                  </p>
                </div>
              </div>

              {/* Discord */}
              <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-indigo-50 to-white p-4 transition-all hover:shadow-md hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-muran-dark">Discord</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Canal privado para comunicação
                  </p>
                </div>
              </div>

              {/* ClickUp */}
              <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 transition-all hover:shadow-md hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FolderKanban className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-muran-dark">ClickUp</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Projeto completo para gestão
                  </p>
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
