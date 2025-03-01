
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";

interface CampaignsTableProps {
  campaigns: SimpleMetaCampaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  // Certifique-se de que cada campanha tem um valor de gasto numérico válido
  const normalizedCampaigns = campaigns.map(campaign => ({
    ...campaign,
    spend: typeof campaign.spend === 'number' 
      ? campaign.spend 
      : parseFloat(String(campaign.spend || "0"))
  }));

  // Calcule o total gasto com segurança
  const totalSpent = normalizedCampaigns.reduce((sum, campaign) => {
    const spendValue = isNaN(campaign.spend) ? 0 : campaign.spend;
    return sum + spendValue;
  }, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          Total gasto em campanhas: {formatCurrency(totalSpent)}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {normalizedCampaigns.map((campaign) => (
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
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  let bgColor = "bg-gray-100 text-gray-800";
  let statusText = status;
  
  if (status === "ACTIVE") {
    bgColor = "bg-green-100 text-green-800";
    statusText = "Ativa";
  } else if (status === "PAUSED") {
    bgColor = "bg-yellow-100 text-yellow-800";
    statusText = "Pausada";
  } else if (status === "ARCHIVED" || status === "DELETED") {
    bgColor = "bg-red-100 text-red-800";
    statusText = status === "ARCHIVED" ? "Arquivada" : "Excluída";
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
      {statusText}
    </span>
  );
}
