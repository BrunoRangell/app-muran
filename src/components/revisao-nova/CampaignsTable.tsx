
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";
import { Badge } from "@/components/ui/badge";

interface CampaignsTableProps {
  campaigns: SimpleMetaCampaign[];
}

export const CampaignsTable = ({ campaigns }: CampaignsTableProps) => {
  // Ordenar campanhas pelo valor gasto (do maior para o menor)
  const sortedCampaigns = [...campaigns].sort((a, b) => b.spend - a.spend);
  
  // Calcular o total
  const totalSpend = campaigns.reduce((total, campaign) => total + campaign.spend, 0);
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto (R$)</TableHead>
            <TableHead className="text-right">% do Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
              <TableCell className="text-right">
                {totalSpend > 0 
                  ? `${((campaign.spend / totalSpend) * 100).toFixed(1)}%` 
                  : '0%'}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-gray-50 font-medium">
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">{formatCurrency(totalSpend)}</TableCell>
            <TableCell className="text-right">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" }> = {
    'ACTIVE': { label: 'Ativa', variant: 'default' },
    'PAUSED': { label: 'Pausada', variant: 'secondary' },
    'DELETED': { label: 'Excluída', variant: 'destructive' },
    'ARCHIVED': { label: 'Arquivada', variant: 'outline' }
  };

  const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

  return (
    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  );
};
