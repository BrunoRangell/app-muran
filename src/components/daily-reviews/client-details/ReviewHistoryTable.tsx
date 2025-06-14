
import { formatCurrency } from "@/utils/formatters";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { UnifiedTable, ColumnDef } from "@/components/common/UnifiedTable";
import { UnifiedEmptyState } from "@/components/common/UnifiedEmptyState";

interface ReviewHistoryTableProps {
  isLoading: boolean;
  reviewHistory: any[] | null;
}

export const ReviewHistoryTable = ({ isLoading, reviewHistory }: ReviewHistoryTableProps) => {
  const columns: ColumnDef[] = [
    {
      id: 'review_date',
      label: 'Data',
      accessor: 'review_date',
      sortable: true,
      render: (value) => formatDateInBrasiliaTz(value, "dd/MM/yyyy HH:mm")
    },
    {
      id: 'meta_daily_budget_current',
      label: 'Orçamento Diário',
      accessor: 'meta_daily_budget_current',
      sortable: true,
      render: (value) => formatCurrency(value || 0)
    },
    {
      id: 'meta_total_spent',
      label: 'Total Gasto',
      accessor: 'meta_total_spent',
      sortable: true,
      render: (value) => formatCurrency(value || 0)
    },
    {
      id: 'using_custom_budget',
      label: 'Tipo de Orçamento',
      accessor: 'using_custom_budget',
      sortable: true,
      render: (value) => value ? (
        <span className="text-blue-600 font-medium">Personalizado</span>
      ) : (
        <span>Padrão</span>
      )
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-muran-primary" size={18} />
            Histórico de Revisões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedTable
            data={[]}
            columns={columns}
            isLoading={true}
            loadingRows={5}
          />
        </CardContent>
      </Card>
    );
  }

  if (!reviewHistory || reviewHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="text-muran-primary" size={18} />
            Histórico de Revisões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedEmptyState
            title="Nenhuma revisão encontrada"
            description="Nenhum histórico de revisão disponível para este cliente"
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="text-muran-primary" size={18} />
          Histórico de Revisões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedTable
          data={reviewHistory}
          columns={columns}
          emptyMessage="Nenhuma revisão encontrada"
        />
      </CardContent>
    </Card>
  );
};
