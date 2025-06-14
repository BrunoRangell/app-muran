
import { UnifiedTable, ColumnDef } from "@/components/common/UnifiedTable";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Client } from "../types";
import { formatCellContent, calculateRetention } from "./utils";
import { useTableSort } from "@/hooks/common/useTableSort";

interface ClientsTableProps {
  clients: Client[];
  columns: any[];
  onEditClick: (client: Client) => void;
  sortConfig: any;
  onSort: (key: string) => void;
  isLoading?: boolean;
}

export const ClientsTable = ({ 
  clients, 
  columns, 
  onEditClick, 
  isLoading
}: ClientsTableProps) => {
  const { sortConfig, sortedData, handleSort } = useTableSort({
    data: clients || [],
    initialSort: { key: 'company_name', direction: 'asc' }
  });

  const clientsWithRetention = sortedData.map(client => ({
    ...client,
    calculatedRetention: calculateRetention(client)
  }));

  const tableColumns: ColumnDef<Client>[] = columns
    .filter(col => col.show)
    .sort((a, b) => {
      if (a.fixed && !b.fixed) return -1;
      if (!a.fixed && b.fixed) return 1;
      return 0;
    })
    .map(column => ({
      id: column.id,
      label: column.label,
      sortable: true,
      render: (value: any, client: Client) => {
        if (column.id === 'status') {
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                client.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {client.status === "active" ? "Ativo" : "Inativo"}
            </span>
          );
        }
        return formatCellContent(client, column.id);
      }
    }));

  tableColumns.push({
    id: 'actions',
    label: 'Ações',
    sortable: false,
    className: 'text-right',
    render: (value: any, client: Client) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEditClick(client);
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    )
  });

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <UnifiedTable
              data={clientsWithRetention}
              columns={tableColumns}
              isLoading={isLoading}
              sortConfig={sortConfig}
              onSort={handleSort}
              emptyMessage="Nenhum cliente encontrado"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
