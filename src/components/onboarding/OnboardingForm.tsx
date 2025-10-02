import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useClientForm } from "@/hooks/useClientForm";
import { CompanySection } from "@/components/admin/client-form/CompanySection";
import { PaymentSection } from "@/components/admin/client-form/PaymentSection";
import { StatusSection } from "@/components/admin/client-form/StatusSection";
import { ContactSection } from "@/components/admin/client-form/ContactSection";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingResult } from "./OnboardingResult";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const OnboardingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState({
    clickup: true,
    discord: true,
    drive: true,
  });
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);

  const handleOnboardingSuccess = async (clientData: any) => {
    setIsOnboarding(true);

    try {
      // Chamar edge function orquestradora
      const { data, error } = await supabase.functions.invoke('orchestrate-client-onboarding', {
        body: {
          clientId: clientData.id,
          integrations
        }
      });

      if (error) throw error;

      setOnboardingResult({
        success: true,
        clientName: clientData.company_name,
        clientId: clientData.id,
        ...data
      });

      toast({
        title: "✅ Cliente criado com sucesso!",
        description: `${clientData.company_name} foi criado e as integrações foram processadas.`,
      });

    } catch (error: any) {
      console.error('Erro no onboarding:', error);
      
      setOnboardingResult({
        success: false,
        error: error.message
      });

      toast({
        title: "❌ Erro no onboarding",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsOnboarding(false);
    }
  };

  const {
    form,
    isLoading,
    showLastPaymentDate,
    handleSubmit,
  } = useClientForm({
    onSuccess: handleOnboardingSuccess
  });

  const onSubmit = async (data: any) => {
    await handleSubmit(data);
  };

  if (onboardingResult) {
    return (
      <OnboardingResult
        result={onboardingResult}
        onClose={() => setOnboardingResult(null)}
        onNewClient={() => {
          setOnboardingResult(null);
          form.reset();
        }}
      />
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">📝 Informações Básicas</h3>
            <div className="space-y-4">
              <CompanySection form={form} />
              <PaymentSection form={form} />
              <StatusSection form={form} showLastPaymentDate={showLastPaymentDate} />
              <ContactSection form={form} />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Integrações Automáticas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">🔧 Integrações Automáticas</h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="clickup"
                  checked={integrations.clickup}
                  onCheckedChange={(checked) =>
                    setIntegrations((prev) => ({ ...prev, clickup: !!checked }))
                  }
                />
                <Label htmlFor="clickup" className="cursor-pointer">
                  ☑ Criar projeto no ClickUp
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="discord"
                  checked={integrations.discord}
                  onCheckedChange={(checked) =>
                    setIntegrations((prev) => ({ ...prev, discord: !!checked }))
                  }
                />
                <Label htmlFor="discord" className="cursor-pointer">
                  ☑ Criar canal no Discord
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="drive"
                  checked={integrations.drive}
                  onCheckedChange={(checked) =>
                    setIntegrations((prev) => ({ ...prev, drive: !!checked }))
                  }
                />
                <Label htmlFor="drive" className="cursor-pointer">
                  ☑ Criar pasta no Google Drive
                </Label>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clientes')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Criando..." : "Criar Cliente Completo"}
            </Button>
          </div>
        </form>
      </Form>

      <OnboardingProgress isOpen={isOnboarding} />
    </>
  );
};
