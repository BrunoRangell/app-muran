
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { StatusIndicator } from "./StatusIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Settings, Loader2 } from "lucide-react";
import { PlatformHealthData } from "./types";

function PlatformCell({ 
  platformData, 
  platformName, 
  clientId, 
  onAction 
}: { 
  platformData?: PlatformHealthData;
  platformName: 'meta' | 'google';
  clientId: string;
  onAction: (action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') => void;
}) {
  if (!platformData) {
    return (
      <TableCell className="text-center text-gray-400">
        <div className="space-y-1">
          <div className="text-xs">Não configurado</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('configure', clientId, platformName)}
            className="text-xs h-6 px-2"
          >
            <Settings className="w-3 h-3 mr-1" />
            Configurar
          </Button>
        </div>
      </TableCell>
    );
  }

  return (
    <TableCell>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <StatusIndicator status={platformData.status} showLabel={false} />
          <div className="text-xs text-gray-500">
            {platformData.activeCampaignsCount} campanhas
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className={platformData.costToday > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
            R$ {platformData.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={platformData.impressionsToday > 0 ? "text-blue-600" : "text-gray-500"}>
            {platformData.impressionsToday.toLocaleString('pt-BR')} imp.
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('details', clientId, platformName)}
            className="text-xs h-6 px-2"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onAction('review', clientId, platformName)}
            className="text-xs h-6 px-2"
          >
            Revisar
          </Button>
        </div>
      </div>
    </TableCell>
  );
}

export function NewHealthTable() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    handleAction,
    handleRefresh,
    lastRefreshTimestamp
  } = useActiveCampaignHealth();

  if (error) {
    return (
      <div className="p-6 text-center text-destructive font-bold rounded shadow bg-red-50">
        <div className="mb-4">Erro ao buscar dados: {error}</div>
        <Button variant="outline" onClick={handleRefresh}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <div className="mb-4">
          Nenhum resultado encontrado com os filtros aplicados.
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar dados
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de atualização */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Saúde das Campanhas ({data.length} clientes)
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-64">Cliente</TableHead>
              <TableHead className="text-center">Status Geral</TableHead>
              <TableHead className="text-center w-48">Meta Ads</TableHead>
              <TableHead className="text-center w-48">Google Ads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((client) => (
              <TableRow key={client.clientId}>
                {/* Cliente */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.clientName}</span>
                    <div className="flex gap-2 mt-1">
                      {client.metaAds && (
                        <Badge variant="outline" className="text-xs">
                          Meta: {client.metaAds.accountId}
                        </Badge>
                      )}
                      {client.googleAds && (
                        <Badge variant="outline" className="text-xs">
                          Google: {client.googleAds.accountId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                {/* Status Geral */}
                <TableCell className="text-center">
                  <StatusIndicator status={client.overallStatus} />
                </TableCell>
                
                {/* Meta Ads */}
                <PlatformCell
                  platformData={client.metaAds}
                  platformName="meta"
                  clientId={client.clientId}
                  onAction={handleAction}
                />
                
                {/* Google Ads */}
                <PlatformCell
                  platformData={client.googleAds}
                  platformName="google"
                  clientId={client.clientId}
                  onAction={handleAction}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Informações da última atualização */}
      <div className="text-xs text-muted-foreground text-center">
        Dados atualizados automaticamente a cada 10 minutos • 
        Última atualização: {lastRefreshTimestamp > 0 ? new Date(lastRefreshTimestamp).toLocaleTimeString('pt-BR') : 'Carregando...'}
        {isFetching && " • Atualizando..."}
      </div>
    </div>
  );
}
