
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Activity, Check, Copy, ExternalLink, Info, Loader, Search } from "lucide-react";

interface ApiTestToolsProps {
  isLoading: boolean;
  client?: {
    meta_account_id?: string;
  } | null;
  testMetaToken: () => Promise<boolean | void>;
  testEdgeFunction: () => Promise<boolean | void>;
  handleOpenGraphExplorer: () => void;
  handleMakeSampleRequest: () => void;
}

export function ApiTestTools({ 
  isLoading, 
  client, 
  testMetaToken, 
  testEdgeFunction,
  handleOpenGraphExplorer,
  handleMakeSampleRequest
}: ApiTestToolsProps) {
  const { toast } = useToast();

  const handleCopyApiUrl = () => {
    if (client?.meta_account_id) {
      const url = `https://graph.facebook.com/v20.0/act_${client.meta_account_id}/campaigns?fields=status,name,spend,insights{spend}&access_token=TOKEN`;
      navigator.clipboard.writeText(url);
      toast({
        title: "URL copiada",
        description: "A URL da API foi copiada para a área de transferência. Substitua TOKEN pelo token real.",
      });
    }
  };

  return (
    <Alert className="mt-4 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-500" />
      <AlertTitle>Ferramentas de diagnóstico</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={testMetaToken}
              className="text-xs"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Testar Validação do Token
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={testEdgeFunction}
              className="text-xs"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-3 w-3 mr-1 animate-spin" /> : <Activity className="h-3 w-3 mr-1" />}
              Testar Função Edge
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenGraphExplorer}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir Graph API Explorer
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://business.facebook.com/settings/ad-accounts`, '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Verificar Contas de Anúncios
            </Button>

            {client?.meta_account_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMakeSampleRequest}
                className="text-xs"
              >
                <Search className="h-3 w-3 mr-1" />
                Testar Consulta no Explorer
              </Button>
            )}
          </div>

          {client?.meta_account_id && (
            <div>
              <p className="text-sm mb-1">URL para testar no Graph API Explorer:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 p-1 text-xs rounded flex-1 overflow-x-auto">
                  https://graph.facebook.com/v20.0/act_{client.meta_account_id}/campaigns?fields=status,name,spend
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyApiUrl}
                  className="shrink-0"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
