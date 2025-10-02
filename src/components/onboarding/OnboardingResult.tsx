import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingResultProps {
  result: any;
  onClose: () => void;
  onNewClient: () => void;
}

export const OnboardingResult = ({ result, onClose, onNewClient }: OnboardingResultProps) => {
  const navigate = useNavigate();

  if (!result.success) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            Erro no Onboarding
          </CardTitle>
          <CardDescription>Ocorreu um erro ao processar o onboarding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{result.error}</p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Tentar Novamente
            </Button>
            <Button onClick={() => navigate('/clientes')}>
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-destructive" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return 'Concluído';
    if (status === 'failed') return 'Falhou';
    return 'Parcial';
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          🎉 Cliente criado com sucesso!
        </CardTitle>
        <CardDescription>
          Status: {getStatusText(result.status)} ({result.summary?.successful}/{result.summary?.enabled} integrações)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações do Cliente */}
        <div>
          <h4 className="font-semibold mb-2">📋 Informações</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Nome:</span> {result.clientName}</p>
            <p><span className="font-medium">ID:</span> {result.clientId}</p>
          </div>
        </div>

        {/* Links das Integrações */}
        <div>
          <h4 className="font-semibold mb-3">🔗 Links das Integrações</h4>
          <div className="space-y-3">
            {/* ClickUp */}
            {result.results?.clickup && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {result.results.clickup.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">📁 ClickUp</span>
                </div>
                {result.results.clickup.success ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.results.clickup.folderLink, '_blank')}
                  >
                    Ver Projeto <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {result.results.clickup.error || 'Falhou'}
                  </span>
                )}
              </div>
            )}

            {/* Discord */}
            {result.results?.discord && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {result.results.discord.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">💬 Discord</span>
                </div>
                {result.results.discord.success ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.results.discord.channelLink, '_blank')}
                  >
                    Abrir Canal <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {result.results.discord.error || 'Falhou'}
                  </span>
                )}
              </div>
            )}

            {/* Google Drive */}
            {result.results?.drive && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {result.results.drive.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">📂 Google Drive</span>
                </div>
                {result.results.drive.success ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.results.drive.folderLink, '_blank')}
                  >
                    Acessar Pasta <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {result.results.drive.error || 'Falhou'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4">
          <Button onClick={() => navigate('/clientes')} variant="outline">
            Ir para Dashboard
          </Button>
          <Button onClick={onNewClient}>
            Criar Outro Cliente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
