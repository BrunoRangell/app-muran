import { useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Columns3,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Group,
  ListFilter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  TASK_COLUMN_LABEL,
  TaskColumnId,
  useShowCompleted,
  useTaskColumnPrefs,
} from "@/components/tasks/taskPreferences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  GroupBy,
  GROUP_BY_LABEL,
  SortBy,
  SortDir,
  SortValue,
  SORT_BY_LABEL,
  TaskMember,
  TaskPriority,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  parseSort,
  serializeSort,
} from "@/types/tasks";
import { countActiveFilters, normalizeFilters } from "@/components/tasks/taskGrouping";

export interface ToolbarState {
  group_by: GroupBy;
  sort_by: SortValue | null;
  filters: TaskViewFilters;
}

const btn =
  "flex h-7 items-center gap-1.5 rounded px-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground";

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const CheckRow = ({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <Label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[12px] font-normal hover:bg-accent/60">
    <Checkbox checked={checked} onCheckedChange={onToggle} className="h-3.5 w-3.5" />
    {children}
  </Label>
);

/** Barra fixa de Filtrar / Ordenar / Agrupar (estilo ClickUp). */
export const TasksToolbar = ({
  members,
  statuses,
  value,
  onChange,
}: {
  members: TaskMember[];
  statuses: TaskStatus[];
  value: ToolbarState;
  onChange: (next: ToolbarState) => void;
}) => {
  const f = normalizeFilters(value.filters);
  const activeCount = countActiveFilters(value.filters);
  const { field: sortField, dir: sortDir } = parseSort(value.sort_by);

  const setFilters = (patch: Partial<ReturnType<typeof normalizeFilters>>) =>
    onChange({ ...value, filters: { ...f, ...patch } });

  const setSort = (field: SortBy | null, dir: SortDir) =>
    onChange({ ...value, sort_by: serializeSort(field, dir) });

  return (
    <div className="flex items-center gap-0.5">
      {/* Filtrar */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(btn, activeCount && "text-foreground")}>
            <Filter className="h-3.5 w-3.5" />
            Filtrar
            {activeCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="tasks-dark w-64 p-2 text-foreground">
          <div className="max-h-[380px] space-y-2 overflow-y-auto">
            <div>
              <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Responsável
              </p>
              {members.map((m) => (
                <CheckRow
                  key={m.id}
                  checked={f.assignee_ids.includes(m.id)}
                  onToggle={() => setFilters({ assignee_ids: toggle(f.assignee_ids, m.id) })}
                >
                  {m.name}
                </CheckRow>
              ))}
            </div>
            <Separator />
            <div>
              <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Prioridade
              </p>
              {(Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => (
                <CheckRow
                  key={p}
                  checked={f.priorities.includes(p)}
                  onToggle={() => setFilters({ priorities: toggle(f.priorities, p) })}
                >
                  <span className={TASK_PRIORITY_META[p].flag}>{TASK_PRIORITY_META[p].label}</span>
                </CheckRow>
              ))}
            </div>
            <Separator />
            <div>
              <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Status
              </p>
              {statuses.map((s) => (
                <CheckRow
                  key={s}
                  checked={f.statuses.includes(s)}
                  onToggle={() => setFilters({ statuses: toggle(f.statuses, s) })}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", TASK_STATUS_META[s].dot)} />
                    {TASK_STATUS_META[s].label}
                  </span>
                </CheckRow>
              ))}
            </div>
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 w-full text-[12px]"
              onClick={() =>
                onChange({ ...value, filters: { assignee_ids: [], priorities: [], statuses: [] } })
              }
            >
              <X className="mr-1 h-3.5 w-3.5" /> Limpar filtros
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Ordenar */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(btn, sortField && "text-foreground")}>
            <ListFilter className="h-3.5 w-3.5" />
            Ordenar
            {sortField && (
              <span className="text-[11px] text-muted-foreground">
                · {SORT_BY_LABEL[sortField]}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="tasks-dark w-52 p-2 text-foreground">
          <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
            Campo
          </p>
          <button
            type="button"
            onClick={() => setSort(null, "asc")}
            className={cn(
              "w-full rounded px-1.5 py-1 text-left text-[12px] hover:bg-accent/60",
              !sortField && "bg-accent/60"
            )}
          >
            Padrão
          </button>
          {(Object.keys(SORT_BY_LABEL) as SortBy[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s, sortDir)}
              className={cn(
                "w-full rounded px-1.5 py-1 text-left text-[12px] hover:bg-accent/60",
                sortField === s && "bg-accent/60"
              )}
            >
              {SORT_BY_LABEL[s]}
            </button>
          ))}
          <Separator className="my-2" />
          <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase text-muted-foreground">
            Direção
          </p>
          <div className="flex gap-1">
            {(["asc", "desc"] as SortDir[]).map((d) => (
              <button
                key={d}
                type="button"
                disabled={!sortField}
                onClick={() => setSort(sortField, d)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded px-1.5 py-1 text-[12px] hover:bg-accent/60 disabled:opacity-40",
                  sortDir === d && sortField && "bg-accent/60"
                )}
              >
                {d === "asc" ? (
                  <ArrowUpAZ className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                )}
                {d === "asc" ? "Crescente" : "Decrescente"}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Agrupar */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btn}>
            <Group className="h-3.5 w-3.5" />
            Agrupar
            <span className="text-[11px] text-muted-foreground">
              · {GROUP_BY_LABEL[value.group_by]}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="tasks-dark w-48 p-2 text-foreground">
          {(Object.keys(GROUP_BY_LABEL) as GroupBy[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...value, group_by: g })}
              className={cn(
                "w-full rounded px-1.5 py-1 text-left text-[12px] hover:bg-accent/60",
                value.group_by === g && "bg-accent/60"
              )}
            >
              {GROUP_BY_LABEL[g]}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};
