import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface KanbanColumnDef<S extends string> {
  id: S;
  label: string;
  dot: string;
  border: string;
  header: string;
}

interface KanbanBoardProps<T extends { id: string }, S extends string> {
  columns: KanbanColumnDef<S>[];
  items: T[];
  getStatus: (item: T) => S;
  onStatusChange: (item: T, status: S) => void;
  renderCard: (item: T) => ReactNode;
  emptyLabel?: string;
  footer?: (columnId: S) => ReactNode;
}

export function KanbanBoard<T extends { id: string }, S extends string>({
  columns,
  items,
  getStatus,
  onStatusChange,
  renderCard,
  emptyLabel = "Nenhuma tarefa",
  footer,
}: KanbanBoardProps<T, S>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<S | null>(null);

  const handleDrop = (columnId: S) => {
    const item = items.find((i) => i.id === draggingId);
    setDraggingId(null);
    setOverColumn(null);
    if (!item || getStatus(item) === columnId) return;
    onStatusChange(item, columnId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnItems = items.filter((i) => getStatus(i) === column.id);
        return (
          <div
            key={column.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(column.id);
            }}
            onDragLeave={() => setOverColumn((c) => (c === column.id ? null : c))}
            onDrop={() => handleDrop(column.id)}
            className={cn(
              "flex w-72 min-w-[18rem] flex-col rounded-xl border border-t-4 bg-muted/40 p-3 transition-colors",
              column.border,
              overColumn === column.id && "bg-muted ring-2 ring-primary/30"
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", column.dot)} />
              <h3 className={cn("text-sm font-semibold", column.header)}>{column.label}</h3>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnItems.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {columnItems.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  {emptyLabel}
                </p>
              )}
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverColumn(null);
                  }}
                  className={cn("cursor-grab active:cursor-grabbing", draggingId === item.id && "opacity-50")}
                >
                  {renderCard(item)}
                </div>
              ))}
            </div>

            {footer && <div className="mt-2">{footer(column.id)}</div>}
          </div>
        );
      })}
    </div>
  );
}
