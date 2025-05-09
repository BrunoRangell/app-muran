
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { useBatchOperations } from "./hooks/useBatchOperations";
import { PlatformType } from "./types";

interface ClientsTableProps {
  data: any[];
  platform: PlatformType;
}

export function ClientsTable({ data, platform }: ClientsTableProps) {
  const { reviewClient, processingIds, isProcessingAccount } = useBatchOperations({
    platform
  });
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Orçamento</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Diário Atual</TableHead>
                <TableHead className="text-right">Diário Ideal</TableHead>
                <TableHead className="text-right">Ajuste</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((client) => {
                const isProcessing = processingIds.includes(client.id) || 
                  isProcessingAccount(client.id, client[`${platform}_account_id`]);
                const accountName = client[`${platform}_account_name`] || "Conta Principal";
                const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
                const budgetAmount = client.budget_amount || 0;
                const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
                const needsAdjustment = client.needsAdjustment;
                const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
                const currentDailyBudget = client.review?.[`${platform}_daily_budget_current`] || 0;
                const idealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;

                return (
                  <TableRow 
                    key={`${client.id}-${client[`${platform}_account_id`] || 'default'}`}
                    className={needsAdjustment ? 'bg-amber-50/30' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {needsAdjustment && <AlertTriangle size={16} className="text-amber-500" />}
                        {client.company_name}
                      </div>
                    </TableCell>
                    <TableCell>{accountName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(budgetAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(spentAmount)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`${
                        spentPercentage > 90 ? "text-red-500" :
                        spentPercentage > 70 ? "text-amber-500" :
                        "text-emerald-500"
                      }`}>
                        {Math.round(spentPercentage)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(currentDailyBudget)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(idealDailyBudget)}</TableCell>
                    <TableCell className="text-right">
                      {needsAdjustment ? (
                        <div className="flex items-center justify-end gap-1">
                          {budgetDifference > 0 ? (
                            <TrendingUp size={16} className="text-green-500" />
                          ) : (
                            <TrendingDown size={16} className="text-red-500" />
                          )}
                          {formatCurrency(Math.abs(budgetDifference))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
                        onClick={() => reviewClient(client.id, client[`${platform}_account_id`])}
                        disabled={isProcessing}
                      >
                        {isProcessing ? "..." : "Revisar"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
