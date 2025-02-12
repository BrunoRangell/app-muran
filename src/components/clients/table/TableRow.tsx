
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, Pencil } from "lucide-react";
import { Client, Column } from "../types";
import { formatCellContent } from "./utils";

interface ClientTableRowProps {
  client: Client;
  columns: Column[];
  onEditClick: (client: Client) => void;
  onPaymentClick?: (clientId: string) => void;
  viewMode?: 'default' | 'payments';
}

export const ClientTableRow = ({ 
  client, 
  columns, 
  onEditClick,
  onPaymentClick,
  viewMode = 'default'
}: ClientTableRowProps) => {
  return (
    <TableRow>
      {columns.filter(col => col.show).map(column => {
        const content = formatCellContent(client, column.id);

        if (column.id === 'status') {
          return (
            <TableCell key={column.id}>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  client.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {client.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </TableCell>
          );
        }

        return (
          <TableCell key={column.id}>{content}</TableCell>
        );
      })}
      <TableCell className="text-right">
        {viewMode === 'payments' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaymentClick?.(client.id)}
            disabled={client.status !== 'active'}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Registrar Pagamento
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditClick(client)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};
