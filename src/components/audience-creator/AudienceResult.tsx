import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AudienceResultProps {
  result: {
    created: number;
    failed: number;
    audiences: Array<{
      name: string;
      status: 'success' | 'failed';
      audienceId?: string;
      error?: string;
    }>;
  };
  onCreateNew: () => void;
}

const AudienceResult = ({ result, onCreateNew }: AudienceResultProps) => {
  const { created = 0, failed = 0, audiences = [] } = result || {};
  const total = created + failed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Resultado da Criação</h1>
          <p className="text-muted-foreground">
            Veja o resultado do processo de criação de públicos
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold mb-1">{total}</div>
              <div className="text-sm text-muted-foreground">Total Processado</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">{created}</div>
              <div className="text-sm text-muted-foreground">Criados com Sucesso</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-1">{failed}</div>
              <div className="text-sm text-muted-foreground">Falharam</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Detalhes dos Públicos</h3>
            {audiences.map((audience, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  audience.status === 'success'
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-200 bg-red-50 dark:bg-red-950/20'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {audience.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{audience.name}</div>
                    {audience.audienceId && (
                      <div className="text-xs text-muted-foreground">
                        ID: {audience.audienceId}
                      </div>
                    )}
                    {audience.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {audience.error}
                      </div>
                    )}
                  </div>
                </div>
                <Badge
                  variant={audience.status === 'success' ? 'default' : 'destructive'}
                  className="ml-2 flex-shrink-0"
                >
                  {audience.status === 'success' ? 'Sucesso' : 'Falhou'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreateNew} size="lg" className="group">
            Criar Novos Públicos
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudienceResult;
