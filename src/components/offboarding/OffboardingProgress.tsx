import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const OffboardingProgress = () => {
  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-destructive" />
          Processando Offboarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={50} className="h-2" />
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Validando cliente...</p>
          <p>✓ Criando registro de offboarding...</p>
          <p className="text-foreground font-medium">⏳ Criando tarefas no ClickUp...</p>
          <p className="opacity-50">○ Finalizando processo...</p>
        </div>
      </CardContent>
    </Card>
  );
};
