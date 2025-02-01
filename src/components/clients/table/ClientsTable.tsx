import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Column, SortConfig } from "../types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { differenceInMonths } from "date-fns";

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
  last_payment_date: string | null;
}

interface ClientsTableProps {
  clients: Client[] | undefined;
  columns: Column[];
  onEditClick: (client: Client) => void;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export const ClientsTable = ({ clients, columns, onEditClick, sortConfig, onSort }: ClientsTableProps) => {
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  const calculateRetention = (client: Client) => {
    const startDate = new Date(client.first_payment_date);
    const endDate = client.status === "active" 
      ? new Date()
      : client.last_payment_date 
        ? new Date(client.last_payment_date)
        : new Date();
    
    return Math.max(differenceInMonths(endDate, startDate), 0);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {sortedColumns.filter(col => col.show).map(column => (
              <TableHead 
                key={column.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  sortConfig.key === column.id ? 'bg-muran-secondary/50' : ''
                }`}
                onClick={() => onSort(column.id)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {sortConfig.key === column.id ? (
                    <span className="text-muran-primary">
                      {sortConfig.direction === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients?.map((client) => (
            <TableRow key={client.id}>
              {sortedColumns.filter(col => col.show).map(column => {
                let content = client[column.id as keyof Client];
                
                if (column.id === 'contract_value') {
                  content = formatCurrency(client.contract_value);
                } else if (column.id === 'first_payment_date' || column.id === 'company_birthday' || column.id === 'last_payment_date') {
                  content = formatDate(content as string);
                } else if (column.id === 'payment_type') {
                  content = content === 'pre' ? 'Pré-pago' : 'Pós-pago';
                } else if (column.id === 'retention') {
                  const months = calculateRetention(client);
                  content = `${months} ${months === 1 ? 'mês' : 'meses'}`;
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