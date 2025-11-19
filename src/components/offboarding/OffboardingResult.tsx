import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface OffboardingResultProps {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  onReset: () => void;
}

export const OffboardingResult = ({
  success,
  message,
  data,
  error,
  onReset,
}: OffboardingResultProps) => {
  return (
    <Card className={success ? "border-green-500/20" : "border-destructive/20"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {success ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Offboarding Concluído
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-destructive" />
              Erro no Offboarding
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <>
            <p className="text-sm text-muted-foreground">{message}</p>

            {data?.clickup && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">ClickUp</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarefas criadas:</span>
                    <span className="font-medium">
                      {data.clickup.data.tasksCreated} de {data.clickup.data.totalTasks}
                    </span>
                  </div>
                  {data.clickup.data.listUrl && (
                    <a
                      href={data.clickup.data.listUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      Ver lista no ClickUp
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Verifique os logs para mais detalhes ou tente novamente.
            </p>
          </div>
        )}

        <Button onClick={onReset} variant="outline" className="w-full">
          Fazer Novo Offboarding
        </Button>
      </CardContent>
    </Card>
  );
};
