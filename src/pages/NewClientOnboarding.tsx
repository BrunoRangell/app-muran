import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClientOnboarding() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">🎯 Novo Cliente - Onboarding Completo</CardTitle>
          <CardDescription>
            Crie um novo cliente e configure automaticamente as integrações com ClickUp, Discord e Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
