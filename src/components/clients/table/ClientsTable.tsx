import { Table, TableBody } from "@/components/ui/table";
import { Client, Column, SortConfig } from "../types";
import { ClientsTableHeader } from "./TableHeader";
import { ClientTableRow } from "./TableRow";
import { calculateRetention } from "./utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsTableProps {
  clients: Client[];
  columns: Column[];
  onEditClick: (client: Client) => void;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  isLoading?: boolean;
}

export const ClientsTable = ({ clients, columns, onEditClick, sortConfig, onSort, isLoading }: ClientsTableProps) => {
  // Reorganiza as colunas (fixas primeiro)
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  // Adiciona a retenção calculada para permitir ordenação por essa métrica
  const clientsWithRetention = clients?.map((client) => ({
    ...client,
    calculatedRetention: calculateRetention(client),
  }));

  // Aplica a ordenação ativa
  const sortedClients = clientsWithRetention?.sort((a, b) => {
    if (!sortConfig.key) return 0;

    if (sortConfig.key === "retention") {
      return sortConfig.direction === "asc"
        ? a.calculatedRetention - b.calculatedRetention
        : b.calculatedRetention - a.calculatedRetention;
    }

    const aValue = a[sortConfig.key as keyof Client];
    const bValue = b[sortConfig.key as keyof Client];

    if (aValue == null || bValue == null) return 0;
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Exibe skeleton durante o carregamento
  if (isLoading) {
    return (
      <div className="space-y-4 border rounded-md p-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-4 p-3 border-b animate-pulse">
            {sortedColumns
              .filter((col) => col.show)
              .map((col, colIndex) => (
                <div key={colIndex} className="flex-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            <div className="w-10">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="inline-block min-w-full align-middle">
          <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
            {/* Cabeçalho fixo */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <ClientsTableHeader columns={sortedColumns} sortConfig={sortConfig} onSort={onSort} />
            </div>

            {/* Corpo da tabela */}
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              <Table className="min-w-full">
                <TableBody>
                  {sortedClients?.map((client, index) => (
                    <ClientTableRow
                      key={client.id}
                      client={client}
                      columns={sortedColumns}
                      onEditClick={onEditClick}
                      // 🔹 Efeito zebra e hover refinado
                      className={`transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-muran-primary/5`}
                    />
                  ))}

                  {/* Caso não haja resultados */}
                  {(!sortedClients || sortedClients.length === 0) && (
                    <tr>
                      <td colSpan={sortedColumns.length} className="text-center py-6 text-gray-500 text-sm">
                        Nenhum cliente encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
