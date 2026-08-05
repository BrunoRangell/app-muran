import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/tasks/MemberAvatar";
import {
  GroupBy,
  SortValue,
  Task,
  TaskPriority,
  TaskMember,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";
import { useReorderTasks, useUpdateTask } from "@/hooks/useTasks";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { DueDateRecurrencePanel } from "@/components/tasks/DueDateRecurrencePanel";
import { describeRecurrence } from "@/components/tasks/recurrence";
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Flag,
  GripVertical,
  MessageSquare,
  Pencil,
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
  const date = parseDue(value);
  return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
};

/** Converte "YYYY-MM-DD" em Date local (evita shift de timezone). */
function parseDue(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Data local → "YYYY-MM-DD". */
const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const PRIORITY_OPTIONS: TaskPriority[] = ["baixa", "normal", "alta", "urgente"];


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
  const [columnPrefs, setColumnPrefs] = useTaskColumnPrefs();
  const [showCompleted] = useShowCompleted();
  /** Largura em andamento durante o arraste (não persistida até soltar). */
  const [dragging, setDragging] = useState<{ id: TaskColumnId; width: number } | null>(null);
  /** Renomeação inline do título (ativada pelo lápis no hover). */
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  /** Arraste manual de reordenação (restrito ao mesmo grupo). */
  const [dragTask, setDragTask] = useState<{ id: string; groupKey: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ groupKey: string; index: number } | null>(null);
  const updateTask = useUpdateTask();
  const reorderTasks = useReorderTasks();

  /** Persiste a nova ordem do grupo ao soltar a tarefa arrastada. */
  const commitReorder = (groupKey: string, rows: Task[]) => {
    const drag = dragTask;
    const target = dropTarget;
    setDragTask(null);
    setDropTarget(null);
    if (!drag || drag.groupKey !== groupKey || !target || target.groupKey !== groupKey) return;
    const ids = rows.map((t) => t.id);
    const without = ids.filter((id) => id !== drag.id);
    const removedBefore = ids.indexOf(drag.id) < target.index ? 1 : 0;
    const at = Math.min(Math.max(target.index - removedBefore, 0), without.length);
    const next = [...without.slice(0, at), drag.id, ...without.slice(at)];
    if (next.join("|") === ids.join("|")) return;
    reorderTasks.mutate(next);
  };

  const commitRename = (task: Task) => {
    const value = renaming?.value.trim();
    setRenaming(null);
    if (value && value !== task.title) updateTask.mutate({ id: task.id, title: value });
  };


  const visibleStatuses = showCompleted ? statuses : statuses.filter((s) => s !== "concluido");
  const pool = showCompleted ? tasks : tasks.filter((t) => t.status !== "concluido");
  const cols = columnPrefs.filter(
    (c) => c.show && (c.id === "origin" ? allowOriginColumn : true)
  );

  const widthOf = (id: TaskColumnId) =>
    dragging?.id === id
      ? dragging.width
      : columnPrefs.find((c) => c.id === id)?.width ?? TASK_COLUMN_DEFAULT_WIDTH[id];

  /** Inicia o arraste do handle de resize do cabeçalho. */
  const startResize = useCallback(
    (id: TaskColumnId, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth =
        columnPrefs.find((c) => c.id === id)?.width ?? TASK_COLUMN_DEFAULT_WIDTH[id];
      let current = startWidth;

      const onMove = (e: MouseEvent) => {
        current = Math.max(TASK_COLUMN_MIN_WIDTH, startWidth + (e.clientX - startX));
        setDragging({ id, width: current });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        setDragging(null);
        setColumnPrefs(
          columnPrefs.map((c) => (c.id === id ? { ...c, width: current } : c))
        );
      };
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [columnPrefs, setColumnPrefs]
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
    /** Responsável — dropdown inline com os membros. */
    if (id === "assignee") {
      const member = members.find((m) => m.id === task.assignee_id);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Alterar responsável"
              className="inline-flex items-center rounded p-[1px] outline-none transition-colors hover:bg-accent"
            >
              {member ? (
                <MemberAvatar member={member} className="h-[22px] w-[22px]" />
              ) : (
                <span className="inline-block h-[22px] w-[22px] rounded-full border border-dashed border-border" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="tasks-dark max-h-[320px] min-w-[200px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="text-[12.5px] text-muted-foreground"
              onClick={() => updateTask.mutate({ id: task.id, assignee_id: null })}
            >
              Sem responsável
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {members.map((m) => (
              <DropdownMenuItem
                key={m.id}
                className="gap-2 text-[12.5px]"
                onClick={() => updateTask.mutate({ id: task.id, assignee_id: m.id })}
              >
                <MemberAvatar member={m} className="h-[20px] w-[20px]" />
                {m.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    /** Status — badge colorido com dropdown inline. */
    if (id === "status") {
      const meta = TASK_STATUS_META[task.status];
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Alterar status"
              className="max-w-full outline-none"
            >
              <span
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 truncate rounded-[3px] px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-wide",
                  meta.pill
                )}
              >
                <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", meta.pillDot)} />
                {meta.label}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="tasks-dark min-w-[180px]">
            {statuses.map((s) => (
              <DropdownMenuItem
                key={s}
                className="gap-2 text-[12.5px]"
                onClick={() => s !== task.status && updateTask.mutate({ id: task.id, status: s })}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[3px] px-1.5 py-[2px] text-[11px] font-semibold uppercase tracking-wide",
                    TASK_STATUS_META[s].pill
                  )}
                >
                  <span
                    className={cn("h-[7px] w-[7px] rounded-full", TASK_STATUS_META[s].pillDot)}
                  />
                  {TASK_STATUS_META[s].label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    /** Data de vencimento — popover com calendário + recorrência. */
    if (id === "due") {
      const recurrence = task.recurrence ?? null;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Alterar data de vencimento"
              className="flex items-center gap-1.5 rounded px-1 py-[2px] text-[12px] text-muted-foreground transition-colors hover:bg-accent"
            >
              <CalendarIcon className="h-3 w-3 opacity-50" />
              {formatDue(task.due_date) ?? <span className="opacity-40">—</span>}
              {recurrence && (
                <Repeat2
                  className="h-3 w-3 text-primary"
                  aria-label={describeRecurrence(recurrence)}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            collisionPadding={12}
            className="tasks-dark pointer-events-auto w-[280px] overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >

            <DueDateRecurrencePanel
              dueDate={task.due_date}
              recurrence={recurrence}
              onChange={(patch) => updateTask.mutate({ id: task.id, ...patch })}
            />
          </PopoverContent>
        </Popover>
      );
    }
    /** Prioridade — dropdown inline. */
    if (id === "priority") {
      const priority = task.priority ? TASK_PRIORITY_META[task.priority] : null;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Alterar prioridade"
              className="inline-flex items-center gap-1 rounded px-1 py-[2px] text-[12px] text-muted-foreground transition-colors hover:bg-accent"
            >
              {priority ? (
                <>
                  <Flag className={cn("h-3 w-3", priority.flag)} />
                  {priority.label}
                </>
              ) : (
                <Flag className="h-3 w-3 text-muted-foreground/30" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="tasks-dark min-w-[170px]"
            onClick={(e) => e.stopPropagation()}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <DropdownMenuItem
                key={p}
                className="gap-2 text-[12.5px]"
                onClick={() => updateTask.mutate({ id: task.id, priority: p })}
              >
                <Flag className={cn("h-3 w-3", TASK_PRIORITY_META[p].flag)} />
                {TASK_PRIORITY_META[p].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-[12.5px] text-muted-foreground"
              onClick={() => updateTask.mutate({ id: task.id, priority: null })}
            >
              <Flag className="h-3 w-3 opacity-40" /> Sem prioridade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                      <span
                        key={c.id}
                        className="relative shrink-0 pr-2"
                        style={{ width: widthOf(c.id) }}
                      >
                        {TASK_COLUMN_LABEL[c.id]}
                        <span
                          role="separator"
                          aria-label={`Redimensionar ${TASK_COLUMN_LABEL[c.id]}`}
                          onMouseDown={(e) => startResize(c.id, e)}
                          className="absolute -right-[2px] top-[-6px] h-[calc(100%+12px)] w-[4px] cursor-col-resize select-none bg-transparent transition-colors hover:bg-primary/60"
                        />
                      </span>
                    ))}
                  </div>

                  {rows.map((task, index) => (
                    <div
                      key={task.id}
                      onDragOver={(e) => {
                        if (!dragTask || dragTask.groupKey !== group.key) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > rect.top + rect.height / 2;
                        setDropTarget({ groupKey: group.key, index: after ? index + 1 : index });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        commitReorder(group.key, rows);
                      }}
                      className={cn(
                        "group flex items-center border-b border-border/50 px-3 py-[7px] transition-colors last:border-b-0 hover:bg-accent/50",
                        dragTask?.id === task.id && "opacity-40",
                        dropTarget?.groupKey === group.key &&
                          dropTarget.index === index &&
                          "border-t-2 border-t-primary",
                        dropTarget?.groupKey === group.key &&
                          dropTarget.index === index + 1 &&
                          "border-b-2 border-b-primary"
                      )}
                    >
                      {/* Alça de arraste para reordenar dentro do grupo */}
                      <span
                        draggable
                        onDragStart={() => setDragTask({ id: task.id, groupKey: group.key })}
                        onDragEnd={() => {
                          setDragTask(null);
                          setDropTarget(null);
                        }}
                        role="button"
                        aria-label="Arrastar para reordenar"
                        className="-ml-2 mr-0.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
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

                        {renaming?.id === task.id ? (
                          <Input
                            autoFocus
                            value={renaming.value}
                            onChange={(e) => setRenaming({ id: task.id, value: e.target.value })}
                            onBlur={() => commitRename(task)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setRenaming(null);
                            }}
                            className="h-7 min-w-0 flex-1 text-[13px]"
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenTask(task)}
                              className="min-w-0 truncate text-left text-[13px] text-foreground hover:underline hover:decoration-border"
                            >
                              {task.title}
                            </button>
                            {task.description && (
                              <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                            )}
                            <button
                              type="button"
                              onClick={() => setRenaming({ id: task.id, value: task.title })}
                              aria-label="Renomear tarefa"
                              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </>
                        )}


                      </div>
                      {cols.map((c) => (
                        <div
                          key={c.id}
                          className="min-w-0 shrink-0 pr-2"
                          style={{ width: widthOf(c.id) }}
                        >
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
