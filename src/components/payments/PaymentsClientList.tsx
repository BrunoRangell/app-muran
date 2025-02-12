
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentsClientListProps {
  onPaymentClick: (clientId: string) => void;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface Payment {
  amount: number;
  reference_month: string;
  notes: string | null;
}

interface ClientWithTotalPayments extends Client {
  total_received: number;
  payments: Payment[];
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
      
      // Primeiro, buscamos os clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("status", { ascending: false })
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Depois, buscamos os pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      // Organizamos os pagamentos por cliente
      const paymentsByClient = paymentsData.reduce((acc: { [key: string]: Payment[] }, payment) => {
        if (payment.client_id) {
          if (!acc[payment.client_id]) {
            acc[payment.client_id] = [];
          }
          acc[payment.client_id].push({
            amount: payment.amount,
            reference_month: payment.reference_month,
            notes: payment.notes
          });
        }
        return acc;
      }, {});

      // Calculamos os totais por cliente
      const totalsByClient = paymentsData.reduce((acc: { [key: string]: number }, payment) => {
        if (payment.client_id) {
          acc[payment.client_id] = (acc[payment.client_id] || 0) + Number(payment.amount);
        }
        return acc;
      }, {});

      // Combinamos os dados
      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => ({
        ...client,
        total_received: totalsByClient[client.id] || 0,
        payments: paymentsByClient[client.id] || []
      }));

      return clientsWithTotals;
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
          return (a.total_received - b.total_received) * direction;
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

  const formatReferenceMonth = (monthStr: string) => {
    try {
      const date = new Date(monthStr);
      return format(date, "MMMM'/'yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar mês:', error);
      return monthStr;
    }
  };

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
                      <SortButton column="total_received" label="Valor Total Recebido" />
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
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {formatCurrency(client.total_received)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className="max-w-[400px] p-4"
                              sideOffset={40}
                            >
                              <div className="space-y-2">
                                <p className="font-medium text-sm mb-2">Histórico de Pagamentos:</p>
                                <div className="max-h-[300px] overflow-y-auto space-y-2">
                                  {client.payments && client.payments.length > 0 ? (
                                    client.payments.map((payment, index) => (
                                      <div key={index} className="border-b last:border-0 pb-2">
                                        <p className="text-sm font-medium">
                                          {formatReferenceMonth(payment.reference_month)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {formatCurrency(payment.amount)}
                                        </p>
                                        {payment.notes && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {payment.notes}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Nenhum pagamento registrado
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
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
