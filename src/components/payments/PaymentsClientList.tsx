
import { Table, TableBody, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentsTableHeader } from "./table/PaymentsTableHeader";
import { PaymentsTableRow } from "./table/PaymentsTableRow";
import { PaymentsClientListProps } from "./types";
import { usePaymentsClients } from "./hooks/usePaymentsClients";
import { usePaymentsSort } from "./hooks/usePaymentsSort";
import { QuickFiltersBar } from "./QuickFiltersBar";
import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export function PaymentsClientList({ onPaymentClick }: PaymentsClientListProps) {
  const { clients, isLoading, handlePaymentUpdated } = usePaymentsClients();
  const [activeFilter, setActiveFilter] = useState('');
  const { 
    sortConfig, 
    searchTerm, 
    setSearchTerm, 
    handleSort, 
    filteredAndSortedClients 
  } = usePaymentsSort(clients);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(activeFilter === filter ? '' : filter);
  };

  const applyFilters = (clients: any[] | undefined) => {
    if (!clients) return [];
    
    let filtered = [...clients];

    // Aplica o filtro de pesquisa
    filtered = filtered.filter(client => 
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplica os filtros rápidos
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(client => client.status === 'active');
        break;
      case 'paid':
        filtered = filtered.filter(client => 
          client.status === 'active' && client.hasCurrentMonthPayment
        );
        break;
      case 'pending':
        filtered = filtered.filter(client => 
          client.status === 'active' && !client.hasCurrentMonthPayment
        );
        break;
    }

    // Aplica a ordenação
    return filtered.sort((a, b) => {
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
          const totalA = Number(a.total_received) || 0;
          const totalB = Number(b.total_received) || 0;
          return (totalA - totalB) * direction;
        default:
          return 0;
      }
    });
  };

  const finalFilteredClients = applyFilters(clients);

  // Calcula os totais dos clientes filtrados
  const totals = finalFilteredClients.reduce((acc, client) => ({
    monthlyTotal: acc.monthlyTotal + (Number(client.contract_value) || 0),
    receivedTotal: acc.receivedTotal + (Number(client.total_received) || 0)
  }), { monthlyTotal: 0, receivedTotal: 0 });

  return (
    <Card className="p-2 md:p-6">
      <div className="flex flex-col space-y-4">
        <QuickFiltersBar 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        
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
                    // Loading skeleton
                    [...Array(5)].map((_, index) => (
                      <TableRow key={index} className="animate-pulse">
                        <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-8 w-8" /></td>
                      </TableRow>
                    ))
                  ) : finalFilteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted-foreground">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  ) : finalFilteredClients.map((client) => (
                    <PaymentsTableRow
                      key={client.id}
                      client={client}
                      onPaymentClick={onPaymentClick}
                      onPaymentUpdated={handlePaymentUpdated}
                    />
                  ))}
                </TableBody>
                {finalFilteredClients.length > 0 && (
                  <TableFooter className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-left">Total</TableHead>
                      <TableHead>{formatCurrency(totals.monthlyTotal)}</TableHead>
                      <TableHead>{formatCurrency(totals.receivedTotal)}</TableHead>
                      <TableHead colSpan={2}></TableHead>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
