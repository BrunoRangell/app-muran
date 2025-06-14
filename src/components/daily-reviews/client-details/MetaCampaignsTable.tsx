
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetaCampaign, MetaDateRange } from "../hooks/types";

interface MetaCampaignsTableProps {
  campaigns: MetaCampaign[];
  dateRange?: MetaDateRange;
}

export const MetaCampaignsTable = ({ campaigns, dateRange }: MetaCampaignsTableProps) => {
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableCaption>
          {dateRange ? 
            `Dados das campanhas no período de ${dateRange.start} até ${dateRange.end}` : 
            'Dados das campanhas no mês atual'}
          <div className="mt-2 font-medium">Total Gasto: {formatCurrency(totalSpent)}</div>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  let bgColor = "bg-gray-100 text-gray-800";
  
  if (status === "ACTIVE") {
    bgColor = "bg-green-100 text-green-800";
  } else if (status === "PAUSED") {
    bgColor = "bg-yellow-100 text-yellow-800";
  } else if (status === "ARCHIVED" || status === "DELETED") {
    bgColor = "bg-red-100 text-red-800";
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {status === "ACTIVE" ? "Ativa" : 
       status === "PAUSED" ? "Pausada" : 
       status === "ARCHIVED" ? "Arquivada" : 
       status === "DELETED" ? "Excluída" : status}
    </span>
  );
};

export const CampaignsTableSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);
