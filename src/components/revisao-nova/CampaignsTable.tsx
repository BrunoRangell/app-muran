
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
  // Validar e garantir que todos os dados são números antes de ordenar
  const processedCampaigns = campaigns.map(campaign => ({
    ...campaign,
    spend: typeof campaign.spend === 'number' 
      ? campaign.spend 
      : parseFloat(String(campaign.spend || '0'))
  }));
  
  // Ordenar campanhas pelo valor gasto (do maior para o menor)
  const sortedCampaigns = [...processedCampaigns].sort((a, b) => b.spend - a.spend);
  
  // Calcular o total
  const totalSpend = processedCampaigns.reduce((total, campaign) => {
    const spend = typeof campaign.spend === 'number' 
      ? campaign.spend 
      : parseFloat(String(campaign.spend || '0'));
    return total + (isNaN(spend) ? 0 : spend);
  }, 0);
  
  // Log detalhado para conferência dos valores
  console.log("[CampaignsTable] Renderizando tabela com dados reais");
  console.log(`[CampaignsTable] Total de campanhas: ${campaigns.length}`);
  console.log(`[CampaignsTable] Total gasto: ${totalSpend}`);
  campaigns.forEach((campaign, index) => {
    console.log(`[CampaignsTable] Campanha ${index + 1}: ${campaign.name}, Gasto: ${campaign.spend}, Status: ${campaign.status}`);
  });
  
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
          {sortedCampaigns.map((campaign) => {
            const spendValue = typeof campaign.spend === 'number' 
              ? campaign.spend 
              : parseFloat(String(campaign.spend || '0'));
            
            const percentage = totalSpend > 0 
              ? (spendValue / totalSpend) * 100 
              : 0;
            
            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <StatusBadge status={campaign.status} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(spendValue)}</TableCell>
                <TableCell className="text-right">
                  {totalSpend > 0 
                    ? `${percentage.toFixed(1)}%` 
                    : '0%'}
                </TableCell>
              </TableRow>
            );
          })}
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
