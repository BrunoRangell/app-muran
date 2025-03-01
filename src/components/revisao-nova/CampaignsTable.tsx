
import { Campaign } from "@/components/daily-reviews/hooks/types";
import { formatCurrency } from "@/utils/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CampaignsTableProps {
  campaigns: Campaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Nenhuma campanha encontrada para este período.
      </div>
    );
  }

  const getCampaignStatus = (status: string | undefined) => {
    if (!status) return { label: "Desconhecido", color: "bg-gray-300" };
    
    const statusLower = String(status).toLowerCase();
    
    if (statusLower === "active") return { label: "Ativa", color: "bg-green-500" };
    if (statusLower === "paused") return { label: "Pausada", color: "bg-amber-500" };
    if (statusLower === "deleted") return { label: "Excluída", color: "bg-red-500" };
    if (statusLower === "archived") return { label: "Arquivada", color: "bg-gray-500" };
    
    return { label: String(status), color: "bg-gray-300" };
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign.status);
            const spendValue = typeof campaign.spend === 'number' 
              ? campaign.spend 
              : parseFloat(String(campaign.spend || "0"));
              
            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${status.color} mr-2`}></div>
                          <span>{status.label}</span>
                          <Info className="h-3 w-3 ml-1 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Status original: {campaign.status}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  {isNaN(spendValue) ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                      Valor inválido
                    </Badge>
                  ) : (
                    formatCurrency(spendValue)
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
