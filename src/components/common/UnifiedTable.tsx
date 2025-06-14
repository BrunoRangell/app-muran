
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ColumnDef<T = any> {
  id: string;
  label: string;
  accessor?: keyof T | ((item: T) => any);
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface UnifiedTableProps<T = any> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  loadingRows?: number;
}

export function UnifiedTable<T = any>({
  data,
  columns,
  isLoading = false,
  sortConfig,
  onSort,
  onRowClick,
  className,
  emptyMessage = "Nenhum item encontrado",
  loadingRows = 5
}: UnifiedTableProps<T>) {
  const getCellValue = (item: T, column: ColumnDef<T>) => {
    if (column.render) {
      const value = column.accessor 
        ? typeof column.accessor === 'function' 
          ? column.accessor(item)
          : item[column.accessor]
        : item;
      return column.render(value, item);
    }
    
    if (column.accessor) {
      return typeof column.accessor === 'function' 
        ? column.accessor(item)
        : item[column.accessor];
    }
    
    return '';
  };

  const SortButton = ({ column }: { column: ColumnDef<T> }) => {
    if (!column.sortable || !onSort) {
      return <span>{column.label}</span>;
    }

    return (
      <Button
        variant="ghost"
        onClick={() => onSort(column.id)}
        className="h-8 p-0 font-medium hover:bg-transparent"
      >
        {column.label}
        {sortConfig?.key === column.id ? (
          <span className="ml-2 text-muran-primary">
            {sortConfig.direction === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </span>
        ) : (
          <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
        )}
      </Button>
    );
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.id} 
                className={cn(
                  column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors",
                  sortConfig?.key === column.id && "bg-muran-secondary/50",
                  column.className
                )}
                style={{ width: column.width }}
              >
                <SortButton column={column} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(loadingRows)].map((_, index) => (
              <TableRow key={index} className="animate-pulse">
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow 
                key={index}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    className={column.className}
                  >
                    {getCellValue(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
