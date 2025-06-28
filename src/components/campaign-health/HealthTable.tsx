
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

  // Helper para lidar com single ou multiple accounts
  const getFirstAccount = (platformData: any) => {
    if (!platformData) return null;
    return Array.isArray(platformData) ? platformData[0] : platformData;
  };

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

      {/* Tabela Reformulada */}
      <div className="overflow-auto rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Meta Ads</TableHead>
              <TableHead>Google Ads</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((client) => {
              const metaAccount = getFirstAccount(client.metaAds);
              const googleAccount = getFirstAccount(client.googleAds);
              
              return (
                <TableRow key={client.clientId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.clientName}</span>
                      <span className="text-xs text-muted-foreground">
                        {client.companyEmail || ""}
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Meta Ads Column */}
                  <TableCell>
                    {metaAccount ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <HealthStatusIndicator status={metaAccount.status} />
                          <span className="text-sm font-medium">Meta Ads</span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Custo:</span>
                            <span className={metaAccount.costToday > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                              R$ {metaAccount.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          {metaAccount.impressionsToday && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Impressões:</span>
                              <span className="text-xs">
                                {metaAccount.impressionsToday.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                          
                          {metaAccount.errors.length > 0 ? (
                            <div className="text-xs">
                              {metaAccount.errors.map((error, i) => (
                                <div key={i} className="text-red-600 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  {error}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              Funcionando
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Não configurado
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Google Ads Column */}
                  <TableCell>
                    {googleAccount ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <HealthStatusIndicator status={googleAccount.status} />
                          <span className="text-sm font-medium">Google Ads</span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Custo:</span>
                            <span className={googleAccount.costToday > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                              R$ {googleAccount.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          {googleAccount.impressionsToday && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Impressões:</span>
                              <span className="text-xs">
                                {googleAccount.impressionsToday.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                          
                          {googleAccount.errors.length > 0 ? (
                            <div className="text-xs">
                              {googleAccount.errors.map((error, i) => (
                                <div key={i} className="text-red-600 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  {error}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                              Funcionando
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Não configurado
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Actions Column */}
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {metaAccount && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('details', client.clientId, 'Meta Ads')}
                            className="text-xs"
                          >
                            Meta
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction('review', client.clientId, 'Meta Ads')}
                            className="text-xs"
                          >
                            Revisar
                          </Button>
                        </div>
                      )}
                      
                      {googleAccount && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('details', client.clientId, 'Google Ads')}
                            className="text-xs"
                          >
                            Google
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction('review', client.clientId, 'Google Ads')}
                            className="text-xs"
                          >
                            Revisar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
