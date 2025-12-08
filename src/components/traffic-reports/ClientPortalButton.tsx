import { useState } from "react";
import { Link2, Copy, Check, RefreshCw, Power, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClientPortalByClient, useManageClientPortal } from "@/hooks/useClientPortal";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ClientPortalButtonProps {
  clientId: string;
  clientName?: string;
}

export function ClientPortalButton({ clientId, clientName }: ClientPortalButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  const { data: portal, isLoading } = useClientPortalByClient(clientId);
  const { createPortal, togglePortal, regenerateToken } = useManageClientPortal();

  const portalUrl = portal 
    ? `${window.location.origin}/cliente/${portal.access_token}`
    : null;

  const handleCreatePortal = async () => {
    if (!user?.id) return;
    await createPortal.mutateAsync({ clientId, userId: user.id });
  };

  const handleCopyLink = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async () => {
    if (!portal) return;
    await togglePortal.mutateAsync({ 
      portalId: portal.id, 
      isActive: !portal.is_active 
    });
  };

  const handleRegenerate = async () => {
    if (!portal) return;
    await regenerateToken.mutateAsync(portal.id);
  };

  const handleOpenPortal = () => {
    if (portalUrl) {
      window.open(portalUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={portal ? "default" : "outline"} 
              size="sm"
              className={portal ? "bg-muran-primary hover:bg-muran-primary/90" : ""}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {portal ? "Link Ativo" : "Gerar Link"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {portal ? "Gerenciar link do cliente" : "Gerar link de acesso para o cliente"}
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-muran-primary" />
            Link do Relatório
          </DialogTitle>
          <DialogDescription>
            {clientName ? `Link de acesso para ${clientName}` : "Link de acesso para o cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!portal ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Gere um link único para que o cliente possa acessar seu relatório
                a qualquer momento, sem precisar de login.
              </p>
              <Button 
                onClick={handleCreatePortal} 
                disabled={createPortal.isPending}
                className="bg-muran-primary hover:bg-muran-primary/90"
              >
                {createPortal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Gerar Link do Cliente
              </Button>
            </div>
          ) : (
            <>
              {/* URL Display */}
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={portalUrl || ''}
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border truncate"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copiar link</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleOpenPortal}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir em nova aba</TooltipContent>
                </Tooltip>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{portal.access_count} visualizações</span>
                </div>
                {portal.last_accessed_at && (
                  <span className="text-xs text-muted-foreground">
                    Último acesso: {new Date(portal.last_accessed_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggle}
                  disabled={togglePortal.isPending}
                  className="flex-1"
                >
                  {togglePortal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  {portal.is_active ? "Desativar" : "Ativar"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRegenerate}
                  disabled={regenerateToken.isPending}
                  className="flex-1"
                >
                  {regenerateToken.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerar
                </Button>
              </div>

              {!portal.is_active && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ Este link está desativado. O cliente não pode acessar o relatório.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
