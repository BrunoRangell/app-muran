
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface SecondaryAccountRowProps {
  clientId: string;
  budget: any;
  onBudgetChange: (id: string, value: string, type: string) => void;
  onBudgetBlur: (id: string, platform: string, accountType: string) => void;
  onAccountIdChange: (id: string, value: string, accountType: string) => void;
  onGoogleBudgetChange: (id: string, value: string, accountType: string) => void;
  onGoogleAccountIdChange: (id: string, value: string, accountType: string) => void;
}

export const SecondaryAccountRow = ({
  clientId,
  budget,
  onBudgetChange,
  onBudgetBlur,
  onAccountIdChange,
  onGoogleBudgetChange,
  onGoogleAccountIdChange
}: SecondaryAccountRowProps) => {
  return (
    <TableRow className="bg-gray-50/50">
      <TableCell className="text-xs text-gray-500 pl-8">
        Conta secundária
      </TableCell>
      <TableCell>
        <Input
          value={budget?.secondaryAccountId || ""}
          onChange={(e) => onAccountIdChange(clientId, e.target.value, 'secondary')}
          placeholder="ID da conta Meta secundária"
          className="bg-white"
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          value={budget?.secondaryFormattedValue || ""}
          onChange={(e) => onBudgetChange(clientId, e.target.value, 'secondary')}
          onBlur={() => onBudgetBlur(clientId, 'meta', 'secondary')}
          placeholder="R$ 0,00"
          className="text-right bg-white"
        />
      </TableCell>
      <TableCell>
        <Input
          value={budget?.secondaryGoogleAccountId || ""}
          onChange={(e) => onGoogleAccountIdChange(clientId, e.target.value, 'secondary')}
          placeholder="ID da conta Google secundária"
          className="bg-white"
        />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          value={budget?.secondaryGoogleFormattedValue || ""}
          onChange={(e) => onGoogleBudgetChange(clientId, e.target.value, 'secondary')}
          onBlur={() => onBudgetBlur(clientId, 'google', 'secondary')}
          placeholder="R$ 0,00"
          className="text-right bg-white"
        />
      </TableCell>
      <TableCell className="text-right">
        {/* Espaço reservado para futuros controles */}
      </TableCell>
    </TableRow>
  );
};
