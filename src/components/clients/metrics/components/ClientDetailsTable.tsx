
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { Client } from "../../types";
import { parseLocalDate } from "@/utils/dateHelpers";

interface ClientDetailsTableProps {
  clients: Client[];
  metric: string;
}

export const ClientDetailsTable = ({ clients, metric }: ClientDetailsTableProps) => {
  // Ordenar clientes: ativos primeiro, depois por ordem alfabética
  const sortedClients = [...clients].sort((a, b) => {
    // Primeiro por status (ativo primeiro)
    if (a.status !== b.status) {
      return a.status === 'active' ? -1 : 1;
    }
    // Depois por nome alfabético
    return a.company_name.localeCompare(b.company_name, 'pt-BR', { sensitivity: 'base' });
  });

  // Calcular total dos contratos
  const total = clients.reduce((sum, client) => sum + (client.contract_value || 0), 0);

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
        {sortedClients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.company_name}</TableCell>
            <TableCell>{formatCurrency(client.contract_value)}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                client.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {client.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </TableCell>
            <TableCell>{client.acquisition_channel}</TableCell>
            <TableCell>
              {format(parseLocalDate(client.first_payment_date.split('T')[0]), 'dd/MM/yyyy')}
            </TableCell>
            {metric === 'Clientes Cancelados' && client.last_payment_date && (
              <TableCell>
                {format(parseLocalDate(client.last_payment_date.split('T')[0]), 'dd/MM/yyyy')}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-bold">TOTAL</TableCell>
          <TableCell className="font-bold">{formatCurrency(total)}</TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          {metric === 'Clientes Cancelados' && (
            <TableCell></TableCell>
          )}
        </TableRow>
      </TableFooter>
    </Table>
  );
};
