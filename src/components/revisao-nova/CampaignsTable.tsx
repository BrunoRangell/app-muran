
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";
import { useMemo } from "react";

interface CampaignsTableProps {
  campaigns: SimpleMetaCampaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  // Filtrar campanhas com custo > 0 e ordenar por valor (maior primeiro)
  const filteredCampaigns = useMemo(() => {
    return campaigns
      ?.filter(campaign => {
        const spend = Number(campaign.spend) || 0;
        return spend > 0;
      })
      .sort((a, b) => {
        const spendA = Number(a.spend) || 0;
        const spendB = Number(b.spend) || 0;
        return spendB - spendA;
      }) || [];
  }, [campaigns]);

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center">
        <p className="text-sm text-gray-500">Nenhuma campanha encontrada.</p>
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center">
        <p className="text-sm text-gray-500">Nenhuma campanha com gasto no período.</p>
      </div>
    );
  }

  // Calcular o total gasto
  const totalSpent = filteredCampaigns.reduce((sum, campaign) => {
    const spend = Number(campaign.spend) || 0;
    return sum + spend;
  }, 0);

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>
          Total gasto em campanhas: {formatCurrency(totalSpent)}
        </TableCaption>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[50%]">Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCampaigns.map((campaign) => (
            <TableRow key={campaign.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <StatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(campaign.spend))}
              </TableCell>
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
