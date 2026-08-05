import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TaskMember,
  TaskPriority,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { countActiveFilters, normalizeFilters } from "@/components/tasks/taskGrouping";

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

/**
 * Controles de filtro (responsável / prioridade / status) compartilhados pela
 * barra de ferramentas e pelo diálogo de criação/edição de visualização.
 */
export const TaskFiltersPanel = ({
  members,
  statuses,
  value,
  onChange,
  className,
}: {
  members: TaskMember[];
  statuses: TaskStatus[];
  value: TaskViewFilters | null | undefined;
  onChange: (next: TaskViewFilters) => void;
  className?: string;
}) => {
  const f = normalizeFilters(value);
  const activeCount = countActiveFilters(value);

  const setFilters = (patch: Partial<ReturnType<typeof normalizeFilters>>) =>
    onChange({ ...f, ...patch });

  return (
    <div className={className}>
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
          onClick={() => onChange({ assignee_ids: [], priorities: [], statuses: [] })}
        >
          <X className="mr-1 h-3.5 w-3.5" /> Limpar filtros
        </Button>
      )}
    </div>
  );
};
