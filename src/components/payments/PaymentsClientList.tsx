
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaymentsTableHeader } from "./table/PaymentsTableHeader";
import { PaymentsTableRow } from "./table/PaymentsTableRow";
import { PaymentsClientListProps } from "./types";
import { usePaymentsClients } from "./hooks/usePaymentsClients";
import { QuickFiltersBar } from "./QuickFiltersBar";
import { useState } from "react";
import { formatCurrency } from "@/utils/unifiedFormatters";
import { UnifiedTable, ColumnDef } from "@/components/common/UnifiedTable";
import { useTableFilters } from "@/hooks/common/useTableFilters";
import { useTableSort } from "@/hooks/common/useTableSort";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PaymentsClientList({ onPaymentClick }: PaymentsClientListProps) {
  const { clients, isLoading, handlePaymentUpdated } = usePaymentsClients();
  const [activeFilter, setActiveFilter] = useState('');
  
  // Usar os hooks unificados
  const { 
    searchTerm, 
    setSearchTerm, 
    filteredData, 
    setFilter 
  } = useTableFilters({
    data: clients || [],
    searchFields: ['company_name'],
    customFilters: {
      status: (client, value) => {
        if (value === 'active') return client.status === 'active';
        if (value === 'paid') return client.status === 'active' && client.hasCurrentMonthPayment;
        if (value === 'pending') return client.status === 'active' && !client.hasCurrentMonthPayment;
        return true;
      }
    }
  });

  const { sortConfig, sortedData, handleSort } = useTableSort({
    data: filteredData,
    initialSort: { key: 'company_name', direction: 'asc' }
  });

  const handleFilterChange = (filter: string) => {
    const newFilter = activeFilter === filter ? '' : filter;
    setActiveFilter(newFilter);
    setFilter('status', newFilter);
  };

  // Definir colunas da tabela
  const columns: ColumnDef[] = [
    {
      id: 'company_name',
      label: 'Empresa',
      accessor: 'company_name',
      sortable: true,
      render: (value, client) => (
        <div className="flex items-center gap-2">
          {client.status === 'active' && !client.hasCurrentMonthPayment && (
            <div className="h-2 w-2 bg-orange-500 rounded-full" title="Pagamento pendente" />
          )}
          {value}
        </div>
      )
    },
    {
      id: 'contract_value',
      label: 'Valor Mensal',
      accessor: 'contract_value',
      sortable: true,
      render: (value) => formatCurrency(value)
    },
    {
      id: 'total_received',
      label: 'Valor Total Recebido',
      accessor: 'total_received',
      sortable: true,
      render: (value) => formatCurrency(Number(value) || 0)
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value) => (
        <Badge 
          variant={value === 'active' ? 'default' : 'destructive'}
          className={value === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          {value === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      id: 'actions',
      label: 'Ações',
      sortable: false,
      className: 'text-right',
      render: (value, client) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPaymentClick(client.id)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Registrar Pagamento
        </Button>
      )
    }
  ];

  // Calcular totais
  const totals = sortedData.reduce((acc, client) => ({
    monthlyTotal: acc.monthlyTotal + (Number(client?.contract_value) || 0),
    receivedTotal: acc.receivedTotal + (Number(client?.total_received) || 0)
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

        <UnifiedTable
          data={sortedData}
          columns={columns}
          isLoading={isLoading}
          sortConfig={sortConfig}
          onSort={handleSort}
          emptyMessage="Nenhum cliente encontrado"
        />

        {sortedData.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Mensal: {formatCurrency(totals.monthlyTotal)}</span>
              <span>Total Recebido: {formatCurrency(totals.receivedTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
