
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { Client } from "../../types";

interface ClientDetailsTableProps {
  clients: Client[];
  metric: string;
}

export const ClientDetailsTable = ({ clients, metric }: ClientDetailsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empresa</TableHead>
          <TableHead>Valor do Contrato</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Canal de Aquisição</TableHead>
          <TableHead>Início</TableHead>
          {metric === 'Clientes Cancelados' && (
            <TableHead>Último Pagamento</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.company_name}</TableCell>
            <TableCell>{formatCurrency(client.contract_value)}</TableCell>
            <TableCell>{client.status}</TableCell>
            <TableCell>{client.acquisition_channel}</TableCell>
            <TableCell>
              {format(new Date(client.first_payment_date), 'dd/MM/yyyy')}
            </TableCell>
            {metric === 'Clientes Cancelados' && client.last_payment_date && (
              <TableCell>
                {format(new Date(client.last_payment_date), 'dd/MM/yyyy')}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
