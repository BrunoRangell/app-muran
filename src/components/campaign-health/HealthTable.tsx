
import { useCampaignHealthData } from "./hooks/useCampaignHealthData";
import { HealthStatusIndicator } from "./HealthStatusIndicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function HealthTable() {
  const {
    data,
    isLoading,
    error,
    handleAction,
    filterValue
  } = useCampaignHealthData();

  if (error)
    return (
      <div className="p-6 text-center text-destructive font-bold rounded shadow bg-red-50">
        Erro ao buscar dados: {error}
      </div>
    );

  if (isLoading) {
    return (
      <div>
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-1 rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="text-center text-muted-foreground p-8">
        Nenhum cliente encontrado para hoje.
      </div>
    );

  return (
    <div className="overflow-auto rounded-lg shadow border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Custo Hoje</TableHead>
            <TableHead>Impressões Hoje</TableHead>
            <TableHead>Campanhas com Erro</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.filter(client =>
            filterValue === "" || client.clientName.toLowerCase().includes(filterValue.toLowerCase())
          ).map((client) =>
            [ ...client.platforms ].map(platform => (
              <TableRow key={client.clientId + platform.name}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.clientName}</span>
                    <span className="text-xs text-muted-foreground">{client.companyEmail || ""}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{platform.name}</div>
                </TableCell>
                <TableCell>
                  R$ {platform.costToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {platform.impressionsToday ?? "-"}
                </TableCell>
                <TableCell>
                  {platform.errors.length > 0 ? (
                    <ul className="marker:text-red-500 text-destructive text-xs list-disc ml-4">
                      {platform.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  ) : (
                    <span className="text-emerald-700 text-xs">Nenhum erro</span>
                  )}
                </TableCell>
                <TableCell>
                  <HealthStatusIndicator status={platform.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
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
  );
}
