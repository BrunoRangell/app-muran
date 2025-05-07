
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/utils/formatters";

interface ClientsTableProps {
  data: any[];
  platform: "meta" | "google";
}

export function ClientsTable({ data, platform }: ClientsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Orç. Diário</TableHead>
            <TableHead className="text-right">Orç. Ideal</TableHead>
            <TableHead className="text-right">Total Gasto</TableHead>
            <TableHead className="text-right">% do Orç.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((client) => {
            const accountName = client[`${platform}_account_name`];
            const percentageSpent = client.totalBudget > 0 
              ? (client.totalSpent / client.totalBudget) * 100 
              : 0;

            return (
              <TableRow key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`} 
                className={client.needsAdjustment ? "bg-amber-50" : ""}>
                <TableCell className="font-medium">{client.company_name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{accountName || "N/A"}</span>
                    {platform === 'meta' && accountName && (
                      <span className="text-xs text-gray-500">
                        CA: {accountName}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(client.dailyBudget || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(client.idealBudget || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(client.totalSpent || 0)}</TableCell>
                <TableCell className="text-right">{formatPercentage(percentageSpent/100)}</TableCell>
                <TableCell>
                  {client.needsAdjustment ? (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                      Ajuste Necessário
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      Ok
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-muran-primary hover:bg-muran-primary/90"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
