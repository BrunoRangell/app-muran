
import { useActiveCampaignHealth } from "./hooks/useActiveCampaignHealth";
import { StatusIndicator } from "./StatusIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Settings } from "lucide-react";

export function NewHealthTable() {
  const {
    data,
    isLoading,
    error,
    handleAction,
    refetch
  } = useActiveCampaignHealth();

  if (error) {
    return (
      <div className="p-6 text-center text-destructive font-bold rounded shadow bg-red-50">
        <div className="mb-4">Erro ao buscar dados: {error}</div>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
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
        <Button variant="outline" onClick={() => refetch()}>
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
          Saúde das Campanhas ({data.length} registros)
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Custo Hoje</TableHead>
              <TableHead>Impressões Hoje</TableHead>
              <TableHead>Campanhas Ativas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={`${row.clientId}-${row.platform}-${index}`}>
                {/* Cliente */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{row.clientName}</span>
                    {row.accountName && (
                      <span className="text-xs text-muted-foreground">
                        {row.accountName}
                      </span>
                    )}
                  </div>
                </TableCell>
                
                {/* Plataforma */}
                <TableCell>
                  <Badge variant={row.platform === 'meta' ? 'default' : 'secondary'}>
                    {row.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                  </Badge>
                </TableCell>
                
                {/* Status */}
                <TableCell>
                  <StatusIndicator status={row.status} />
                </TableCell>
                
                {/* Custo Hoje */}
                <TableCell>
                  <span className={row.costToday > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                    R$ {row.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                
                {/* Impressões Hoje */}
                <TableCell>
                  <span className={row.impressionsToday > 0 ? "text-blue-600" : "text-gray-500"}>
                    {row.impressionsToday.toLocaleString('pt-BR')}
                  </span>
                </TableCell>
                
                {/* Campanhas Ativas */}
                <TableCell>
                  <span className={row.activeCampaignsCount > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                    {row.activeCampaignsCount}
                  </span>
                </TableCell>
                
                {/* Ações */}
                <TableCell>
                  <div className="flex gap-1">
                    {row.hasAccount ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction('details', row.clientId, row.platform)}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Detalhes
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAction('review', row.clientId, row.platform)}
                          className="text-xs"
                        >
                          Revisar {row.platform === 'meta' ? 'Meta' : 'Google'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction('configure', row.clientId, row.platform)}
                        className="text-xs"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Configurar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Informações da última atualização */}
      <div className="text-xs text-muted-foreground text-center">
        Dados atualizados automaticamente a cada 10 minutos • 
        Última atualização: {new Date().toLocaleTimeString('pt-BR')}
      </div>
    </div>
  );
}
