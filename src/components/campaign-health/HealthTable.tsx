
import { useCampaignHealthData } from "./hooks/useCampaignHealthData";
import { HealthStatusIndicator } from "./HealthStatusIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

export function HealthTable() {
  const {
    data,
    isLoading,
    error,
    handleAction,
    filterValue,
    isRefreshing,
    refetch
  } = useCampaignHealthData();

  if (error)
    return (
      <div className="p-6 text-center text-destructive font-bold rounded shadow bg-red-50">
        Erro ao buscar dados: {error}
      </div>
    );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="text-center text-muted-foreground p-8">
        <div className="mb-4">
          Nenhum cliente com campanhas ativas encontrado para hoje.
        </div>
        <Button 
          variant="outline" 
          onClick={() => handleAction('mass-review')}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            'Executar Revisão'
          )}
        </Button>
      </div>
    );

  // Filtrar dados baseado no filtro
  const filteredData = data.filter(client =>
    filterValue === "" || client.clientName.toLowerCase().includes(filterValue.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Botão de Revisão em Massa */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Campanhas Hoje</h2>
        <Button 
          onClick={() => handleAction('mass-review')}
          disabled={isRefreshing}
          variant="default"
          size="sm"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Atualizando Dados...
            </>
          ) : (
            'Revisar Todos'
          )}
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Custo Hoje</TableHead>
              <TableHead>Impressões Hoje</TableHead>
              <TableHead>Campanhas com Erro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((client) =>
              client.platforms.map(platform => (
                <TableRow key={`${client.clientId}-${platform.name}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.clientName}</span>
                      <span className="text-xs text-muted-foreground">
                        {client.companyEmail || ""}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <HealthStatusIndicator status={platform.status} />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className={platform.costToday > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                      R$ {platform.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {platform.impressionsToday ? platform.impressionsToday.toLocaleString('pt-BR') : "N/A"}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {platform.errors.length > 0 ? (
                      <div className="text-destructive text-sm">
                        {platform.errors.map((error, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Nenhum erro
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('details', client.clientId, platform.name)}
                      >
                        Detalhes
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction('review', client.clientId, platform.name)}
                      >
                        Revisar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Informações da última atualização */}
      <div className="text-xs text-muted-foreground text-center">
        Dados atualizados automaticamente a cada 5 minutos • 
        Última atualização: {new Date().toLocaleTimeString('pt-BR')}
      </div>
    </div>
  );
}
