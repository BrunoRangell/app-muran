
import {
  Table,
  TableBody,
} from "@/components/ui/table";
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

export const ClientsTable = ({ 
  clients, 
  columns, 
  onEditClick, 
  sortConfig, 
  onSort,
  isLoading
}: ClientsTableProps) => {
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  // Adiciona a retenção calculada aos clientes para ordenação
  const clientsWithRetention = clients?.map(client => ({
    ...client,
    calculatedRetention: calculateRetention(client)
  }));

  // Ordena os clientes considerando a retenção calculada
  const sortedClients = clientsWithRetention?.sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (sortConfig.key === 'retention') {
      return sortConfig.direction === 'asc' 
        ? a.calculatedRetention - b.calculatedRetention
        : b.calculatedRetention - a.calculatedRetention;
    }
    
    const aValue = a[sortConfig.key as keyof Client];
    const bValue = b[sortConfig.key as keyof Client];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex gap-4 p-4 border-b animate-pulse">
            {sortedColumns.filter(col => col.show).map((col, colIndex) => (
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
          <div className="border rounded-md">
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              <Table>
                <ClientsTableHeader 
                  columns={sortedColumns} 
                  sortConfig={sortConfig} 
                  onSort={onSort} 
                />
                <TableBody>
                  {sortedClients?.map((client) => (
                    <ClientTableRow
                      key={client.id}
                      client={client}
                      columns={sortedColumns}
                      onEditClick={onEditClick}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
