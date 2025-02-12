
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, Search, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentsTableHeader } from "./table/PaymentsTableHeader";
import { PaymentHistory } from "./PaymentHistory";
import { PaymentsClientListProps, SortConfig, ClientWithTotalPayments } from "./types";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { startOfMonth, endOfMonth } from "date-fns";

export function PaymentsClientList({ onPaymentClick }: PaymentsClientListProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'company_name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("Buscando lista de clientes para recebimentos...");
      
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("status", { ascending: false })
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      const paymentsByClient = paymentsData.reduce((acc: { [key: string]: any[] }, payment) => {
        if (payment.client_id) {
          if (!acc[payment.client_id]) {
            acc[payment.client_id] = [];
          }
          acc[payment.client_id].push({
            id: payment.id,
            amount: payment.amount,
            reference_month: payment.reference_month,
            notes: payment.notes
          });
        }
        return acc;
      }, {});

      const totalsByClient = paymentsData.reduce((acc: { [key: string]: number }, payment) => {
        if (payment.client_id) {
          acc[payment.client_id] = (acc[payment.client_id] || 0) + Number(payment.amount);
        }
        return acc;
      }, {});

      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const hasCurrentMonthPayment = clientPayments.some(payment => {
          const paymentDate = new Date(payment.reference_month);
          return paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd;
        });

        return {
          ...client,
          total_received: totalsByClient[client.id] || 0,
          payments: clientPayments,
          hasCurrentMonthPayment
        };
      });

      return clientsWithTotals;
    }
  });

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePaymentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  const filteredAndSortedClients = clients
    ?.filter(client => 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }

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
                <PaymentsTableHeader 
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {client.status === 'active' && !client.hasCurrentMonthPayment && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Pagamento do mês atual não registrado</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {client.company_name}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(client.contract_value)}</TableCell>
                      <TableCell>
                        <PaymentHistory 
                          total={client.total_received}
                          payments={client.payments}
                          clientName={client.company_name}
                          onPaymentUpdated={handlePaymentUpdated}
                        />
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
