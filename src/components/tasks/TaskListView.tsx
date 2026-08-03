import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import {
  GroupBy,
  SortValue,
  Task,
  TaskMember,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { useUpdateTask } from "@/hooks/useTasks";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { usePersistentState } from "@/components/tasks/usePersistentState";
import { buildTaskGroups } from "@/components/tasks/taskGrouping";
import {
  TASK_COLUMN_DEFAULT_WIDTH,
  TASK_COLUMN_LABEL,
  TASK_COLUMN_MIN_WIDTH,
  TaskColumnId,
  useShowCompleted,
  useTaskColumnPrefs,
} from "@/components/tasks/taskPreferences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Flag,
  MessageSquare,
  Repeat2,
} from "lucide-react";

/** Ícone circular de status (igual ao ClickUp: anel colorido + tracinhos). */
const StatusCircle = ({ status }: { status: TaskStatus }) => (
  <span
    className={cn(
      "inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-transform",
      TASK_STATUS_META[status].ring
    )}
  >
    {status === "concluido" && (
      <span className={cn("h-[7px] w-[7px] rounded-full", TASK_STATUS_META[status].dot)} />
    )}
  </span>
);


const formatDue = (value: string | null) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

const formatCreated = (value: string) => {
  const date = new Date(value);
  return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

interface Props {
  statuses: TaskStatus[];
  tasks: Task[];
  members: TaskMember[];
  onOpenTask: (task: Task) => void;
  newTaskScope: { list_id?: string | null; is_internal?: boolean; internal_area?: string | null };
  /** Chave para persistir os grupos recolhidos (localStorage). */
  storageKey?: string;
  groupBy?: GroupBy;
  sortBy?: SortValue | null;
  filters?: TaskViewFilters | null;
  /** Exibe o botão "Adicionar Tarefa" em cada grupo (desligado na visão consolidada). */
  allowCreate?: boolean;
  /** Permite a coluna "Lista/Pasta" (visões consolidadas). */
  allowOriginColumn?: boolean;
}

export const TaskListView = ({
  statuses,
  tasks,
  members,
  onOpenTask,
  newTaskScope,
  storageKey = "tasks:list:collapsed",
  groupBy = "status",
  sortBy,
  filters,
  allowCreate = true,
  allowOriginColumn = false,
}: Props) => {
  const [collapsed, setCollapsed] = usePersistentState<Record<string, boolean>>(storageKey, {});
  const [columnPrefs] = useTaskColumnPrefs();
  const [showCompleted] = useShowCompleted();
  const updateTask = useUpdateTask();
  const visibleStatuses = showCompleted ? statuses : statuses.filter((s) => s !== "concluido");
  const pool = showCompleted ? tasks : tasks.filter((t) => t.status !== "concluido");
  const cols = columnPrefs.filter(
    (c) => c.show && (c.id === "origin" ? allowOriginColumn : true)
  );
  const groups = buildTaskGroups({
    tasks: pool,
    statuses: visibleStatuses,
    members,
    groupBy,
    sortBy,
    filters,
  });

  const renderCell = (id: TaskColumnId, task: Task) => {
    if (id === "assignee") {
      const member = members.find((m) => m.id === task.assignee_id);
      return member ? (
        <MemberAvatar member={member} className="h-[22px] w-[22px]" />
      ) : (
        <span className="inline-block h-[22px] w-[22px] rounded-full border border-dashed border-border" />
      );
    }
    if (id === "due") {
      return (
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Repeat2 className="h-3 w-3 opacity-50" />
          {formatDue(task.due_date) ?? <span className="opacity-40">—</span>}
        </span>
      );
    }
    if (id === "priority") {
      const priority = task.priority ? TASK_PRIORITY_META[task.priority] : null;
      return priority ? (
        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
          <Flag className={cn("h-3 w-3", priority.flag)} />
          {priority.label}
        </span>
      ) : (
        <Flag className="h-3 w-3 text-muted-foreground/30" />
      );
    }
    if (id === "created") {
      return (
        <span className="text-[12px] text-muted-foreground">{formatCreated(task.created_at)}</span>
      );
    }
    const origin = task.is_internal
      ? `Interna · ${task.internal_area ?? ""}`
      : [task.task_lists?.task_folders?.name, task.task_lists?.name].filter(Boolean).join(" · ");
    return (
      <span className="block truncate text-[12px] text-muted-foreground">
        {origin || <span className="opacity-40">—</span>}
      </span>
    );
  };


  return (
    <div className="space-y-5 text-[13px]">
      {groups.map((group) => {
        const rows = group.tasks;
        const isCollapsed = collapsed[group.key];

        return (
          <div key={group.key}>
            {/* Cabeçalho do grupo — clique recolhe/expande */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
              className="flex w-full items-center gap-2 rounded-[4px] px-1 py-1 text-left transition-colors hover:bg-accent/40"
              aria-expanded={!isCollapsed}
            >
              <span className="text-muted-foreground">
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[3px] px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide",
                  group.pill
                )}
              >
                <span className={cn("h-[7px] w-[7px] rounded-full", group.pillDot)} />
                {group.label}
              </span>
              <span className="text-[12px] text-muted-foreground">{rows.length}</span>
            </button>

            <div
              className={cn(
                "grid transition-all duration-200 ease-out",
                isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
              )}
            >
              <div className="overflow-hidden">
                <div className="mt-1 overflow-hidden rounded-[4px] border border-border/70">
                  {/* Cabeçalho de colunas */}
                  <div className="flex items-center border-b border-border/70 bg-card/40 px-3 py-[6px] text-[11px] text-muted-foreground">
                    <span className="min-w-0 flex-1 pl-[26px]">Nome</span>
                    {cols.map((c) => (
                      <span key={c.id} className={cn("shrink-0", TASK_COLUMN_WIDTH[c.id])}>
                        {TASK_COLUMN_LABEL[c.id]}
                      </span>
                    ))}
                  </div>

                  {rows.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onOpenTask(task);
                      }}
                      className="group flex cursor-pointer items-center border-b border-border/50 px-3 py-[7px] transition-colors last:border-b-0 hover:bg-accent/50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {/* Dropdown de status direto na linha */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <span
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex cursor-pointer items-center rounded p-[1px] outline-none transition-colors hover:bg-accent"
                              aria-label="Alterar status"
                            >
                              <StatusCircle status={task.status} />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="tasks-dark min-w-[180px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {statuses.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (s !== task.status) {
                                    updateTask.mutate({ id: task.id, status: s });
                                  }
                                }}
                                className="gap-2 text-[12.5px]"
                              >
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide",
                                    TASK_STATUS_META[s].pill
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-[7px] w-[7px] rounded-full",
                                      TASK_STATUS_META[s].pillDot
                                    )}
                                  />
                                  {TASK_STATUS_META[s].label}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className="truncate text-[13px] text-foreground group-hover:underline group-hover:decoration-border">
                          {task.title}
                        </span>
                        {task.description && (
                          <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                        )}
                      </div>
                      {cols.map((c) => (
                        <div key={c.id} className={cn("min-w-0 shrink-0", TASK_COLUMN_WIDTH[c.id])}>
                          {renderCell(c.id, task)}
                        </div>
                      ))}
                    </div>
                  ))}

                  {allowCreate && (
                  <div className="px-1 py-0.5">
                    <NewTaskDialog
                      members={members}
                      status={groupBy === "status" ? (group.key as TaskStatus) : statuses[0]}
                      scope={newTaskScope as never}
                      defaults={{
                        assignee_id: group.patch?.assignee_id ?? null,
                        priority: group.patch?.priority ?? null,
                      }}
                      label="Adicionar Tarefa"
                    />
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
