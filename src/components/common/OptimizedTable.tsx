
import React, { memo, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePerformanceMonitor } from "@/hooks/common/usePerformanceMonitor";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedTableProps {
  data: any[];
  columns: Array<{
    id: string;
    label: string;
    accessor: string;
    render?: (value: any, row: any) => React.ReactNode;
    sortable?: boolean;
    className?: string;
  }>;
  isLoading?: boolean;
  emptyMessage?: string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string) => void;
  virtualized?: boolean;
  maxHeight?: string;
}

const TableRowMemo = memo(({ 
  row, 
  columns, 
  index 
}: { 
  row: any; 
  columns: OptimizedTableProps['columns']; 
  index: number;
}) => (
  <TableRow key={row.id || index}>
    {columns.map(column => (
      <TableCell key={column.id} className={column.className}>
        {column.render 
          ? column.render(row[column.accessor], row)
          : row[column.accessor]
        }
      </TableCell>
    ))}
  </TableRow>
));

TableRowMemo.displayName = "TableRowMemo";

export const OptimizedTable = memo(({
  data,
  columns,
  isLoading,
  emptyMessage = "Nenhum dado encontrado",
  sortConfig,
  onSort,
  virtualized = false,
  maxHeight = "600px"
}: OptimizedTableProps) => {
  const metrics = usePerformanceMonitor("OptimizedTable");

  // Memoizar header renderizado
  const headerContent = useMemo(() => (
    <TableHeader>
      <TableRow>
        {columns.map(column => (
          <TableHead 
            key={column.id}
            className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
            onClick={column.sortable && onSort ? () => onSort(column.accessor) : undefined}
          >
            <div className="flex items-center gap-2">
              {column.label}
              {column.sortable && sortConfig?.key === column.accessor && (
                <span className="text-xs">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  ), [columns, sortConfig, onSort]);

  // Renderização com skeleton para loading
  const loadingContent = useMemo(() => (
    <TableBody>
      {Array(5).fill(0).map((_, i) => (
        <TableRow key={i}>
          {columns.map(column => (
            <TableCell key={column.id}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  ), [columns]);

  // Renderização de dados vazia
  const emptyContent = useMemo(() => (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
          {emptyMessage}
        </TableCell>
      </TableRow>
    </TableBody>
  ), [columns.length, emptyMessage]);

  // Renderização de dados
  const dataContent = useMemo(() => {
    if (!data.length) return emptyContent;

    return (
      <TableBody>
        {data.map((row, index) => (
          <TableRowMemo 
            key={row.id || index}
            row={row}
            columns={columns}
            index={index}
          />
        ))}
      </TableBody>
    );
  }, [data, columns, emptyContent]);

  const tableStyle = virtualized ? { 
    maxHeight, 
    overflowY: 'auto' as const 
  } : {};

  return (
    <div className="border rounded-md" style={tableStyle}>
      <Table>
        {headerContent}
        {isLoading ? loadingContent : dataContent}
      </Table>
      {metrics.isSlowComponent && (
        <div className="text-xs text-orange-500 p-2">
          ⚠️ Tabela renderizada em {metrics.renderTime.toFixed(2)}ms
        </div>
      )}
    </div>
  );
});

OptimizedTable.displayName = "OptimizedTable";
