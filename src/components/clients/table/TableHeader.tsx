import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Column, SortConfig } from "../types";

interface ClientsTableHeaderProps {
  columns: Column[];
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

export const ClientsTableHeader = ({ columns, sortConfig, onSort }: ClientsTableHeaderProps) => {
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.fixed && !b.fixed) return -1;
    if (!a.fixed && b.fixed) return 1;
    return 0;
  });

  return (
    <TableHeader className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
      <TableRow>
        {sortedColumns
          .filter((col) => col.show)
          .map((column) => (
            <TableHead
              key={column.id}
              onClick={() => onSort(column.id)}
              className={`cursor-pointer select-none transition-colors px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100 ${
                sortConfig.key === column.id ? "bg-muran-primary/5 text-muran-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{column.label}</span>
                <span className="flex-shrink-0">
                  {sortConfig.key === column.id ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </span>
              </div>
            </TableHead>
          ))}

        <TableHead className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
          Ações
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};
