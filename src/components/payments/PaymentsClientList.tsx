
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
import { DollarSign, ArrowDown, ArrowUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedClients = clients?.sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    switch (sortConfig.key) {
      case 'company_name':
        return a.company_name.localeCompare(b.company_name) * direction;
      case 'contract_value':
        return (a.contract_value - b.contract_value) * direction;
      case 'status':
        return a.status.localeCompare(b.status) * direction;
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
      <div className="flex flex-col">
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
                      <SortButton column="status" label="Status" />
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : sortedClients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.company_name}</TableCell>
                      <TableCell>{formatCurrency(client.contract_value)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={client.status === 'active' ? 'default' : 'destructive'}
                          className="capitalize"
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
