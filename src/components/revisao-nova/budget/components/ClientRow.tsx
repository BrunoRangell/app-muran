
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SecondaryAccountRow } from "./SecondaryAccountRow";

interface ClientRowProps {
  client: any;
  budget: any;
  onBudgetChange: (id: string, value: string, type: string) => void;
  onBudgetBlur: (id: string, platform: string, accountType: string) => void;
  onAccountIdChange: (id: string, value: string, accountType: string) => void;
  onGoogleBudgetChange: (id: string, value: string, accountType: string) => void;
  onGoogleAccountIdChange: (id: string, value: string, accountType: string) => void;
  onAddSecondaryAccount: (id: string) => void;
}

export const ClientRow = ({
  client,
  budget,
  onBudgetChange,
  onBudgetBlur,
  onAccountIdChange,
  onGoogleBudgetChange,
  onGoogleAccountIdChange,
  onAddSecondaryAccount
}: ClientRowProps) => {
  return (
    <React.Fragment>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="font-medium">{client.company_name}</TableCell>
        <TableCell>
          <Input
            value={budget?.accountId || ""}
            onChange={(e) => onAccountIdChange(client.id, e.target.value, 'primary')}
            placeholder="ID da conta Meta"
            className="bg-white"
          />
        </TableCell>
        <TableCell>
          <Input
            type="text"
            value={budget?.formattedValue || ""}
            onChange={(e) => onBudgetChange(client.id, e.target.value, 'primary')}
            onBlur={() => onBudgetBlur(client.id, 'meta', 'primary')}
            placeholder="R$ 0,00"
            className="text-right bg-white"
          />
        </TableCell>
        <TableCell>
          <Input
            value={budget?.googleAccountId || ""}
            onChange={(e) => onGoogleAccountIdChange(client.id, e.target.value, 'primary')}
            placeholder="ID da conta Google"
            className="bg-white"
          />
        </TableCell>
        <TableCell>
          <Input
            type="text"
            value={budget?.googleFormattedValue || ""}
            onChange={(e) => onGoogleBudgetChange(client.id, e.target.value, 'primary')}
            onBlur={() => onBudgetBlur(client.id, 'google', 'primary')}
            placeholder="R$ 0,00"
            className="text-right bg-white"
          />
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSecondaryAccount(client.id)}
            title="Adicionar Conta Secundária"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Conta secundária se existir */}
      {budget?.hasSecondary && (
        <SecondaryAccountRow 
          clientId={client.id}
          budget={budget}
          onBudgetChange={onBudgetChange}
          onBudgetBlur={onBudgetBlur}
          onAccountIdChange={onAccountIdChange}
          onGoogleBudgetChange={onGoogleBudgetChange}
          onGoogleAccountIdChange={onGoogleAccountIdChange}
        />
      )}
    </React.Fragment>
  );
};
