
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { SortConfig } from "../types";

interface PaymentsTableHeaderProps {
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export function PaymentsTableHeader({ sortConfig, onSort }: PaymentsTableHeaderProps) {
  const SortButton = ({ column, label }: { column: string; label: string }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(column)}
      className="h-8 p-0 font-medium"
    >
      {label}
      {sortConfig.key === column && (
        <span className="ml-2">
          {sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </span>
      )}
    </Button>
  );

  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <SortButton column="company_name" label="Empresa" />
        </TableHead>
        <TableHead>
          <SortButton column="contract_value" label="Valor Mensal" />
        </TableHead>
        <TableHead>
          <SortButton column="total_received" label="Valor Total Recebido" />
        </TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
}
