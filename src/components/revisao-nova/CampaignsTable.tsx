
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleMetaCampaign } from "@/components/daily-reviews/hooks/types";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface CampaignsTableProps {
  campaigns: SimpleMetaCampaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return "bg-green-100 text-green-800 border-green-300";
    if (statusLower === 'paused') return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (statusLower === 'deleted' || statusLower === 'archived' || statusLower === 'disabled') 
      return "bg-red-100 text-red-800 border-red-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 h-10">
            <TableHead className="font-medium text-gray-700">Nome da Campanha</TableHead>
            <TableHead className="font-medium text-gray-700">Status</TableHead>
            <TableHead className="font-medium text-gray-700 text-right">Gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                Nenhuma campanha encontrada
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="border-b">
                <TableCell className="py-3 font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(campaign.status)} border px-2 py-1 text-xs font-medium`}
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(campaign.spend)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
