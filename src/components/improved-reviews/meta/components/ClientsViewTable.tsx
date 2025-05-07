
import { ClientWithReview } from "../../../daily-reviews/hooks/types/reviewTypes";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ClientsViewTableProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  isProcessingClient: (clientId: string) => boolean;
  onReviewClient: (clientId: string) => Promise<void>;
}

export const ClientsViewTable = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  isProcessingClient,
  onReviewClient
}: ClientsViewTableProps) => {
  // Função para calcular o orçamento ideal se não estiver presente
  const calculateIdealBudget = (client: ClientWithReview): number => {
    if (client.lastReview?.idealDailyBudget !== undefined) {
      return client.lastReview.idealDailyBudget;
    }
    
    if (!client.lastReview) return 0;
    
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const budgetAmount = client.lastReview.using_custom_budget 
      ? client.lastReview.custom_budget_amount || client.meta_ads_budget || 0
      : client.meta_ads_budget || 0;
    
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    
    return remainingDays > 0 ? (budgetAmount - totalSpent) / remainingDays : 0;
  };
  
  const needsAdjustment = (client: ClientWithReview): boolean => {
    if (!client.lastReview || !client.meta_account_id) return false;
    
    const currentBudget = client.lastReview.meta_daily_budget_current || 0;
    const idealBudget = calculateIdealBudget(client);
    
    return Math.abs(idealBudget - currentBudget) >= 5;
  };

  return (
    <ScrollArea className="h-[calc(100vh-400px)]">
      <div className="space-y-6">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">ID da Conta</TableHead>
                <TableHead>Orçamento Mensal</TableHead>
                <TableHead>Orç. Diário Atual</TableHead>
                <TableHead>Orç. Diário Ideal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsWithMetaId.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhum cliente com Meta Ads configurado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientsWithMetaId.map((client) => {
                  const idealBudget = calculateIdealBudget(client);
                  const currentBudget = client.lastReview?.meta_daily_budget_current || 0;
                  const needsAdj = needsAdjustment(client);
                  
                  return (
                    <TableRow 
                      key={client.id} 
                      className={needsAdj ? "bg-amber-50" : ""}
                    >
                      <TableCell className="font-medium">{client.company_name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-xs">{client.meta_account_id}</span>
                      </TableCell>
                      <TableCell>{formatCurrency(client.meta_ads_budget || 0)}</TableCell>
                      <TableCell>
                        {client.lastReview?.meta_daily_budget_current !== undefined
                          ? formatCurrency(client.lastReview.meta_daily_budget_current)
                          : "Não definido"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(idealBudget)}
                      </TableCell>
                      <TableCell>
                        {needsAdj ? (
                          <Badge className="bg-amber-500">Ajuste necessário</Badge>
                        ) : (
                          <Badge className="bg-green-500">Adequado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => onReviewClient(client.id)}
                          disabled={isProcessingClient(client.id)}
                          size="sm"
                        >
                          {isProcessingClient(client.id) ? (
                            <>
                              <Loader className="mr-1 h-3 w-3 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Analisar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {clientsWithoutMetaId.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Clientes sem Meta Ads configurado ({clientsWithoutMetaId.length})
            </h3>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsWithoutMetaId.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.company_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          Meta Ads não configurado
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
