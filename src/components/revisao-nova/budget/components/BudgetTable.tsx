
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { ClientRow } from "./ClientRow";
import { EmptyState } from "./EmptyState";

interface BudgetTableProps {
  filteredClients: any[] | undefined;
  budgets: any;
  handleBudgetChange: (id: string, value: string, type: string) => void;
  handleBudgetBlur: (id: string, platform: string, accountType: string) => void;
  handleAccountIdChange: (id: string, value: string, accountType: string) => void;
  handleGoogleBudgetChange: (id: string, value: string, accountType: string) => void;
  handleGoogleAccountIdChange: (id: string, value: string, accountType: string) => void;
  addSecondaryAccount: (id: string) => void;
  totalBudget: string;
  totalGoogleBudget: string;
}

export const BudgetTable = ({ 
  filteredClients,
  budgets,
  handleBudgetChange,
  handleBudgetBlur,
  handleAccountIdChange,
  handleGoogleBudgetChange,
  handleGoogleAccountIdChange,
  addSecondaryAccount,
  totalBudget,
  totalGoogleBudget
}: BudgetTableProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[25%]">Cliente</TableHead>
            <TableHead className="w-[15%]">ID Conta Meta Ads</TableHead>
            <TableHead className="w-[15%]">Orçamento Meta Ads (R$)</TableHead>
            <TableHead className="w-[15%]">ID Conta Google Ads</TableHead>
            <TableHead className="w-[15%]">Orçamento Google Ads (R$)</TableHead>
            <TableHead className="w-[15%] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients?.length === 0 ? (
            <EmptyState />
          ) : (
            filteredClients?.map((client) => (
              <ClientRow 
                key={client.id}
                client={client}
                budget={budgets[client.id]}
                onBudgetChange={handleBudgetChange}
                onBudgetBlur={handleBudgetBlur}
                onAccountIdChange={handleAccountIdChange}
                onGoogleBudgetChange={handleGoogleBudgetChange}
                onGoogleAccountIdChange={handleGoogleAccountIdChange}
                onAddSecondaryAccount={addSecondaryAccount}
              />
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="text-right font-medium">
              Total de Orçamentos Meta Ads:
            </TableCell>
            <TableCell className="text-right font-medium">
              {totalBudget}
            </TableCell>
            <TableCell className="text-right font-medium">
              Total de Orçamentos Google Ads:
            </TableCell>
            <TableCell className="text-right font-medium">
              {totalGoogleBudget}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
