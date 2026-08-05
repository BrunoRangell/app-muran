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
  /** Ordem manual final da coluna (ids na ordem desejada). */
  onReorder?: (columnId: S, orderedIds: string[]) => void;
  renderCard: (item: T) => ReactNode;
  emptyLabel?: string;
  footer?: (columnId: S) => ReactNode;
}

export function KanbanBoard<T extends { id: string }, S extends string>({
  columns,
  items,
  getStatus,
  onStatusChange,
  onReorder,
  renderCard,
  emptyLabel,
  footer,
}: KanbanBoardProps<T, S>) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<S | null>(null);
  /** Índice de inserção dentro da coluna sob o cursor. */
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDraggingId(null);
    setOverColumn(null);
    setOverIndex(null);
  };

  const handleDrop = (columnId: S) => {
    const item = items.find((i) => i.id === draggingId);
    const index = overIndex;
    reset();
    if (!item) return;

    const sameColumn = getStatus(item) === columnId;
    if (!sameColumn) onStatusChange(item, columnId);

    if (onReorder) {
      const columnIds = items
        .filter((i) => getStatus(i) === columnId && i.id !== item.id)
        .map((i) => i.id);
      const at = index === null || index > columnIds.length ? columnIds.length : index;
      const next = [...columnIds.slice(0, at), item.id, ...columnIds.slice(at)];
      /** Só persiste se a ordem realmente mudou. */
      const current = items.filter((i) => getStatus(i) === columnId).map((i) => i.id);
      if (sameColumn && current.join("|") === next.join("|")) return;
      onReorder(columnId, next);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
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
              "flex w-[280px] min-w-[280px] flex-col rounded-lg p-1 transition-colors",
              overColumn === column.id && "bg-accent/40 ring-1 ring-primary/40"
            )}
          >
            {/* Cabeçalho: pill com pontinho + nome + contador */}
            <div className="mb-2 flex items-center gap-2 px-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold tracking-wide",
                  column.header,
                  "bg-card"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", column.dot)} />
                {column.label}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {columnItems.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              {columnItems.map((item, index) => {
                const dropBefore =
                  !!draggingId && overColumn === column.id && overIndex === index;
                return (
                  <div key={item.id}>
                    {dropBefore && (
                      <div className="mb-1 h-[2px] rounded-full bg-primary" aria-hidden />
                    )}
                    <div
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      onDragEnd={reset}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > rect.top + rect.height / 2;
                        setOverColumn(column.id);
                        setOverIndex(after ? index + 1 : index);
                      }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        draggingId === item.id && "opacity-40"
                      )}
                    >
                      {renderCard(item)}
                    </div>
                  </div>
                );
              })}
              {!!draggingId &&
                overColumn === column.id &&
                overIndex !== null &&
                overIndex >= columnItems.length && (
                  <div className="h-[2px] rounded-full bg-primary" aria-hidden />
                )}
              {columnItems.length === 0 && emptyLabel && (
                <p className="px-1 py-2 text-[11px] text-muted-foreground/70">{emptyLabel}</p>
              )}
            </div>

            {footer && <div className="mt-1">{footer(column.id)}</div>}
          </div>
        );
      })}
    </div>
  );
}
