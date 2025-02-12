
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Client, Column } from "../types";
import { formatCellContent } from "./utils";

interface ClientTableRowProps {
  client: Client;
  columns: Column[];
  onEditClick: (client: Client) => void;
}

export const ClientTableRow = ({ client, columns, onEditClick }: ClientTableRowProps) => {
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
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditClick(client)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
