import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Column } from "../types";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface Client {
  id: string;
  company_name: string;
  contract_value: number;
  first_payment_date: string;
  payment_type: "pre" | "post";
  status: "active" | "inactive";
  acquisition_channel: string;
  company_birthday: string;
  contact_name: string;
  contact_phone: string;
}

interface ClientsTableProps {
  clients: Client[] | undefined;
  columns: Column[];
  onEditClick: (client: Client) => void;
}

export const ClientsTable = ({ clients, columns, onEditClick }: ClientsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.filter(col => col.show).map(column => (
              <TableHead key={column.id}>{column.label}</TableHead>
            ))}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients?.map((client) => (
            <TableRow key={client.id}>
              {columns.filter(col => col.show).map(column => {
                let content = client[column.id];
                
                if (column.id === 'contract_value') {
                  content = formatCurrency(client.contract_value);
                } else if (column.id === 'first_payment_date' || column.id === 'company_birthday') {
                  content = formatDate(content as string);
                } else if (column.id === 'payment_type') {
                  content = content === 'pre' ? 'Pré-pago' : 'Pós-pago';
                } else if (column.id === 'status') {
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};