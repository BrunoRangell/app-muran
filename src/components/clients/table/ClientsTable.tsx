
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { Client, Column, SortConfig } from "../types";
import { ClientsTableHeader } from "./TableHeader";
import { ClientTableRow } from "./TableRow";
import { calculateRetention } from "./utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientsTableProps {
  clients: Client[] | undefined;
  columns: Column[];
  onEditClick: (client: Client) => void;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export const ClientsTable = ({ 
  clients, 
  columns, 
  onEditClick, 
  sortConfig, 
  onSort 
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

  return (
    <div className="border rounded-md">
      <ScrollArea className="max-h-[80vh]">
        <div className="min-w-max">
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
      </ScrollArea>
    </div>
  );
};
