
import { UnifiedTable, ColumnDef } from "@/components/common/UnifiedTable";
import { Calendar, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/unifiedFormatters";

interface Payment {
  id: string;
  amount: number;
  net_amount: number;
  reference_month: string;
  payment_date: string;
  notes: string | null;
  clients: {
    company_name: string;
  };
}

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  const columns: ColumnDef<Payment>[] = [
    {
      id: 'client',
      label: 'Cliente',
      accessor: 'clients',
      sortable: true,
      render: (clients) => clients?.company_name || 'Cliente não encontrado'
    },
    {
      id: 'reference_month',
      label: 'Mês de Referência',
      accessor: 'reference_month',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatDate(value)}
        </div>
      )
    },
    {
      id: 'payment_date',
      label: 'Data do Pagamento',
      accessor: 'payment_date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatDate(value)}
        </div>
      )
    },
    {
      id: 'amount',
      label: 'Valor Bruto',
      accessor: 'amount',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {formatCurrency(value)}
        </div>
      )
    },
    {
      id: 'net_amount',
      label: 'Valor Líquido',
      accessor: 'net_amount',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          {formatCurrency(value)}
        </div>
      )
    },
    {
      id: 'notes',
      label: 'Observações',
      accessor: 'notes',
      sortable: false,
      render: (value) => value || '-'
    }
  ];

  return (
    <UnifiedTable
      data={payments || []}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhum pagamento encontrado"
    />
  );
}
