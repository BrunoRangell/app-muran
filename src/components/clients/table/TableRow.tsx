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
  viewMode?: "default" | "payments";
  className?: string; // ✅ permite aplicar classes externas (corrige o TS2322)
}

export const ClientTableRow = ({
  client,
  columns,
  onEditClick,
  onPaymentClick,
  viewMode = "default",
  className = "",
}: ClientTableRowProps) => {
  return (
    <TableRow
      className={`transition-colors cursor-pointer ${className}`}
      onClick={() => {
        // permite clicar na linha inteira, mas sem interferir no botão
        if (viewMode === "default") onEditClick(client);
      }}
    >
      {columns
        .filter((col) => col.show)
        .map((column) => {
          const content = formatCellContent(client, column.id);

          // STATUS → mostra badge colorido
          if (column.id === "status") {
            return (
              <TableCell key={column.id} className="text-sm font-medium">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    client.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </TableCell>
            );
          }

          // CONTRATO → usa monoespaçada pra números
          if (column.id === "contract_value") {
            return (
              <TableCell key={column.id} className="text-right font-mono text-sm text-gray-800">
                {content}
              </TableCell>
            );
          }

          // CANAL DE AQUISIÇÃO → texto com leve destaque
          if (column.id === "acquisition_channel") {
            return (
              <TableCell key={column.id} className="text-sm text-gray-700 capitalize">
                {content || "-"}
              </TableCell>
            );
          }

          // DEMAIS CAMPOS → padrão simples e alinhado
          return (
            <TableCell key={column.id} className="text-sm text-gray-800">
              {content || "-"}
            </TableCell>
          );
        })}

      {/* AÇÕES */}
      <TableCell className="text-right w-[120px]">
        {viewMode === "payments" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPaymentClick?.(client.id);
            }}
            className="gap-2 text-sm"
          >
            <DollarSign className="h-4 w-4" />
            Registrar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(client);
            }}
            className="hover:text-muran-primary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};
