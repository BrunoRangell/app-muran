
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Column, SortConfig } from "../types";

interface TableHeaderProps {
  columns: Column[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export const ClientsTableHeader = ({ columns, sortConfig, onSort }: TableHeaderProps) => {
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  return (
    <TableHeader>
      <TableRow>
        {sortedColumns.filter(col => col.show).map(column => (
          <TableHead 
            key={column.id}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${
              sortConfig.key === column.id ? 'bg-muran-secondary/50' : ''
            }`}
            onClick={() => onSort(column.id)}
          >
            <div className="flex items-center gap-2">
              {column.label}
              {sortConfig.key === column.id ? (
                <span className="text-muran-primary">
                  {sortConfig.direction === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </span>
              ) : (
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </TableHead>
        ))}
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
};
