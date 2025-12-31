import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, ExternalLink, Key, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMetaToken } from '@/hooks/useMetaToken';
import { useToast } from '@/hooks/use-toast';

export function MetaTokenStatus() {
  const { tokenStatus, isLoading, isRefreshing, refreshToken, updateToken } = useMetaToken();
  const [newToken, setNewToken] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast({
        title: 'Token inválido',
        description: 'Por favor, insira um token válido.',
        variant: 'destructive'
      });
      return;
    }

    const result = await updateToken(newToken.trim());
    if (result.success) {
      setNewToken('');
      setIsDialogOpen(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Link copiado para a área de transferência.'
    });
  };

  const getStatusInfo = () => {
    if (!tokenStatus) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-muted-foreground" />,
        badge: <Badge variant="outline">Desconhecido</Badge>,
        color: 'text-muted-foreground'
      };
    }

    switch (tokenStatus.status) {
      case 'active':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Ativo</Badge>,
          color: 'text-green-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
          badge: <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Expirando</Badge>,
          color: 'text-yellow-500'
        };
      case 'expired':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          badge: <Badge variant="destructive">Expirado</Badge>,
          color: 'text-destructive'
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-muted-foreground" />,
          badge: <Badge variant="outline">Desconhecido</Badge>,
          color: 'text-muted-foreground'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Token Meta Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Token Meta Ads
            </CardTitle>
            <CardDescription>
              Gerencie o token de acesso para a API do Meta Ads
            </CardDescription>
          </div>
          {statusInfo.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Alert */}
        {tokenStatus?.status === 'expired' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Token Expirado</AlertTitle>
            <AlertDescription>
              O token Meta expirou. Você precisa gerar um novo token manualmente para continuar usando as funcionalidades do Meta Ads.
            </AlertDescription>
          </Alert>
        )}

        {tokenStatus?.status === 'warning' && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">Token Expirando</AlertTitle>
            <AlertDescription>
              O token Meta expira em {tokenStatus.daysRemaining} dias. Recomendamos renovar agora para evitar interrupções.
            </AlertDescription>
          </Alert>
        )}

        {/* Token Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className={`font-medium flex items-center gap-1.5 ${statusInfo.color}`}>
              {statusInfo.icon}
              {tokenStatus?.status === 'active' && 'Ativo'}
              {tokenStatus?.status === 'warning' && 'Expirando em breve'}
              {tokenStatus?.status === 'expired' && 'Expirado'}
              {tokenStatus?.status === 'unknown' && 'Desconhecido'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Dias restantes</p>
            <p className={`font-medium ${statusInfo.color}`}>
              {tokenStatus?.daysRemaining !== null 
                ? tokenStatus.daysRemaining > 0 
                  ? `${tokenStatus.daysRemaining} dias`
                  : 'Expirado'
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expira em</p>
            <p className="font-medium">
              {tokenStatus?.expiresAt 
                ? format(tokenStatus.expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Última renovação</p>
            <p className="font-medium">
              {tokenStatus?.lastRefreshed 
                ? format(tokenStatus.lastRefreshed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={refreshToken} 
            disabled={isRefreshing || tokenStatus?.status === 'expired'}
            variant="outline"
            className="flex-1"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Renovar Token
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex-1">
                <Key className="h-4 w-4 mr-2" />
                Novo Token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Inserir Novo Token Meta</DialogTitle>
                <DialogDescription>
                  Siga as instruções abaixo para gerar e inserir um novo token de longa duração.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Como gerar um novo token:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      Acesse o{' '}
                      <a 
                        href="https://developers.facebook.com/tools/explorer/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Graph API Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Selecione seu aplicativo Meta</li>
                    <li>
                      Adicione as permissões:{' '}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">ads_management</code>,{' '}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">ads_read</code>,{' '}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">business_management</code>
                    </li>
                    <li>Clique em "Generate Access Token"</li>
                    <li>
                      Use a URL abaixo para converter em token de longa duração:
                      <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all flex items-start gap-2">
                        <span className="flex-1">
                          https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=383063434848211&client_secret=SEU_SECRET&fb_exchange_token=TOKEN_CURTO
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard('https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=383063434848211&client_secret=SEU_SECRET&fb_exchange_token=TOKEN_CURTO')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                    <li>Copie o token retornado e cole abaixo</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-token">Novo Token de Longa Duração</Label>
                  <Input
                    id="new-token"
                    placeholder="Cole o novo token aqui..."
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleUpdateToken} disabled={isRefreshing || !newToken.trim()}>
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Salvar Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground">
          O token é renovado automaticamente a cada 15 dias. Tokens de longa duração do Meta expiram em 60 dias.
        </p>
      </CardContent>
    </Card>
  );
}
