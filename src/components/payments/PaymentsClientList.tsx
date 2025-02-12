
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/components/clients/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowDown, ArrowUp, Search } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PaymentsClientListProps {
  onPaymentClick: (clientId: string) => void;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function PaymentsClientList({ onPaymentClick }: PaymentsClientListProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'company_name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("Buscando lista de clientes para recebimentos...");
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("status", { ascending: false })
        .order("company_name");

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      return data as Client[];
    }
  });

  // Buscar total de pagamentos por cliente
  const { data: clientTotals } = useQuery({
    queryKey: ['client-payment-totals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('client_id, amount')
        .eq('status', 'RECEIVED');

      if (error) throw error;

      // Calcular o total por cliente
      const totals = data.reduce((acc: Record<string, number>, payment) => {
        if (payment.client_id) { // Garantir que client_id não é null
          acc[payment.client_id] = (acc[payment.client_id] || 0) + payment.amount;
        }
        return acc;
      }, {});

      return totals;
    }
  });

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedClients = clients
    ?.filter(client => 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => {
      // Primeiro ordena por status (ativos primeiro)
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

      // Depois aplica a ordenação selecionada
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'company_name':
          return a.company_name.localeCompare(b.company_name) * direction;
        case 'contract_value':
          return (a.contract_value - b.contract_value) * direction;
        case 'total_received':
          const totalA = clientTotals?.[a.id] || 0;
          const totalB = clientTotals?.[b.id] || 0;
          return (totalA - totalB) * direction;
        default:
          return 0;
      }
    });

  const SortButton = ({ column, label }: { column: string, label: string }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-8 p-0 font-medium"
    >
      {label}
      {sortConfig.key === column && (
        <span className="ml-2">
          {sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </span>
      )}
    </Button>
  );

  return (
    <Card className="p-2 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton column="company_name" label="Empresa" />
                    </TableHead>
                    <TableHead>
                      <SortButton column="contract_value" label="Valor Mensal" />
                    </TableHead>
                    <TableHead>
                      <SortButton column="total_received" label="Total Recebido" />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.company_name}</TableCell>
                      <TableCell>{formatCurrency(client.contract_value)}</TableCell>
                      <TableCell>{formatCurrency(clientTotals?.[client.id] || 0)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.status === 'active' ? 'default' : 'destructive'}
                          className={`capitalize ${client.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        >
                          {client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPaymentClick(client.id)}
                          disabled={client.status !== 'active'}
                          className="gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Registrar Pagamento
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
