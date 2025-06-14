
import { UnifiedTable, ColumnDef } from "@/components/common/UnifiedTable";
import { formatCurrency } from "@/utils/unifiedFormatters";
import { Card } from "@/components/ui/card";
import { MetaCampaign, MetaDateRange } from "../hooks/types";
import { Badge } from "@/components/ui/badge";

interface MetaCampaignsTableProps {
  campaigns: MetaCampaign[];
  dateRange?: MetaDateRange;
}

export const MetaCampaignsTable = ({ campaigns, dateRange }: MetaCampaignsTableProps) => {
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusProps = (status: string) => {
      switch (status) {
        case "ACTIVE":
          return { variant: "default" as const, text: "Ativa", className: "bg-green-500 hover:bg-green-600" };
        case "PAUSED":
          return { variant: "secondary" as const, text: "Pausada", className: "bg-yellow-500 hover:bg-yellow-600" };
        case "ARCHIVED":
        case "DELETED":
          return { variant: "destructive" as const, text: status === "ARCHIVED" ? "Arquivada" : "Excluída" };
        default:
          return { variant: "secondary" as const, text: status };
      }
    };

    const props = getStatusProps(status);
    return <Badge {...props}>{props.text}</Badge>;
  };

  const columns: ColumnDef<MetaCampaign>[] = [
    {
      id: 'name',
      label: 'Nome da Campanha',
      accessor: 'name',
      sortable: true,
      className: 'font-medium'
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />
    },
    {
      id: 'spend',
      label: 'Gasto',
      accessor: 'spend',
      sortable: true,
      className: 'text-right',
      render: (value) => formatCurrency(value)
    }
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <p className="text-sm text-muted-foreground">
          {dateRange ? 
            `Dados das campanhas no período de ${dateRange.start} até ${dateRange.end}` : 
            'Dados das campanhas no mês atual'}
        </p>
        <p className="font-medium mt-2">Total Gasto: {formatCurrency(totalSpent)}</p>
      </div>
      
      <UnifiedTable
        data={campaigns}
        columns={columns}
        emptyMessage="Nenhuma campanha encontrada"
      />
    </Card>
  );
};
