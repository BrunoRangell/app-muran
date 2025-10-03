import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, XCircle, AlertCircle, HardDrive, MessageSquare, FolderKanban, PartyPopper } from "lucide-react";

interface OnboardingResultProps {
  result: any;
  onClose: () => void;
}

export const OnboardingResult = ({ result, onClose }: OnboardingResultProps) => {
  if (!result.success) {
    return (
      <Card className="border-red-200 bg-red-50/50 shadow-lg animate-scale-in">
        <CardHeader className="border-b border-red-200">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-6 w-6" />
            Erro no Onboarding
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Ocorreu um erro ao processar o onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </div>
          <Button onClick={onClose} variant="outline" className="w-full">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'completed') return 'Concluído com Sucesso';
    if (status === 'failed') return 'Falhou';
    return 'Parcialmente Concluído';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'from-green-50 to-emerald-50 border-green-200';
    if (status === 'failed') return 'from-red-50 to-red-50 border-red-200';
    return 'from-yellow-50 to-amber-50 border-yellow-200';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header Card */}
      <Card className={`border-2 bg-gradient-to-br ${getStatusColor(result.status)} shadow-xl`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <PartyPopper className="h-8 w-8 text-muran-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-muran-dark">
                Cliente Criado com Sucesso!
              </CardTitle>
              <CardDescription className="text-base mt-1 flex items-center gap-2">
                {getStatusIcon(result.status)}
                <span className="font-medium">{getStatusText(result.status)}</span>
                <span className="text-muted-foreground">
                  ({result.summary?.successful}/{result.summary?.enabled} integrações)
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">Nome do Cliente</p>
            <p className="text-lg font-semibold text-muran-dark">{result.clientName}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">ID do Cliente</p>
            <p className="text-sm font-mono text-muran-dark">{result.clientId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Integrações Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Google Drive */}
        {result.results?.drive && (
          <Card className={`overflow-hidden transition-all hover:scale-105 ${
            result.results.drive.success 
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  result.results.drive.success ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  <HardDrive className={`h-6 w-6 ${
                    result.results.drive.success ? 'text-blue-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Google Drive</CardTitle>
                  {result.results.drive.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 absolute top-4 right-4" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.results.drive.success ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 hover:bg-blue-100"
                  onClick={() => window.open(result.results.drive.folderLink, '_blank')}
                >
                  Acessar Pasta <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                <p className="text-sm text-red-600 text-center">
                  {result.results.drive.error || 'Falhou'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Discord */}
        {result.results?.discord && (
          <Card className={`overflow-hidden transition-all hover:scale-105 ${
            result.results.discord.success 
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  result.results.discord.success ? 'bg-indigo-100' : 'bg-red-100'
                }`}>
                  <MessageSquare className={`h-6 w-6 ${
                    result.results.discord.success ? 'text-indigo-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">Discord</CardTitle>
                  {result.results.discord.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 absolute top-4 right-4" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.results.discord.success ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 hover:bg-indigo-100"
                  onClick={() => window.open(result.results.discord.channelLink, '_blank')}
                >
                  Abrir Canal <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                <p className="text-sm text-red-600 text-center">
                  {result.results.discord.error || 'Falhou'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ClickUp */}
        {result.results?.clickup && (
          <Card className={`overflow-hidden transition-all hover:scale-105 ${
            result.results.clickup.success 
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  result.results.clickup.success ? 'bg-purple-100' : 'bg-red-100'
                }`}>
                  <FolderKanban className={`h-6 w-6 ${
                    result.results.clickup.success ? 'text-purple-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">ClickUp</CardTitle>
                  {result.results.clickup.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 absolute top-4 right-4" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 absolute top-4 right-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.results.clickup.success ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 hover:bg-purple-100"
                  onClick={() => window.open(result.results.clickup.folderLink, '_blank')}
                >
                  Ver Projeto <ExternalLink className="h-4 w-4" />
                </Button>
              ) : (
                <p className="text-sm text-red-600 text-center">
                  {result.results.clickup.error || 'Falhou'}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botão de Ação */}
      <Card className="border-muran-primary/20 bg-gradient-to-r from-muran-primary/5 to-transparent">
        <CardContent className="pt-6">
          <Button 
            onClick={onClose} 
            className="w-full h-12 text-base bg-gradient-to-r from-muran-primary to-muran-primary/80 hover:from-muran-primary/90 hover:to-muran-primary/70 shadow-lg"
          >
            Criar Novo Cliente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
