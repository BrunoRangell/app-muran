import {
  GroupBy,
  SortBy,
  Task,
  TaskMember,
  TaskPriority,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from "@/types/tasks";

export interface TaskGroup {
  key: string;
  label: string;
  /** classes da pill do cabeçalho */
  pill: string;
  pillDot: string;
  tasks: Task[];
  /** patch aplicado ao mover a tarefa para este grupo (drag & drop do quadro) */
  patch: Partial<Pick<Task, "status" | "assignee_id" | "priority">> | null;
}

const NEUTRAL_PILL = "bg-accent/70 text-foreground/90";

export const applyViewFilters = (tasks: Task[], filters?: TaskViewFilters | null) => {
  if (!filters) return tasks;
  return tasks.filter((t) => {
    if (filters.assignee_id && t.assignee_id !== filters.assignee_id) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
  baixa: 3,
};

export const sortTasks = (tasks: Task[], sortBy?: SortBy | null) => {
  const list = [...tasks];
  if (sortBy === "due") {
    return list.sort((a, b) => (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31"));
  }
  if (sortBy === "priority") {
    return list.sort(
      (a, b) =>
        (a.priority ? PRIORITY_ORDER[a.priority] : 9) - (b.priority ? PRIORITY_ORDER[b.priority] : 9)
    );
  }
  if (sortBy === "created") {
    return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return list;
};

export const buildTaskGroups = ({
  tasks,
  statuses,
  members,
  groupBy = "status",
  sortBy,
  filters,
}: {
  tasks: Task[];
  statuses: TaskStatus[];
  members: TaskMember[];
  groupBy?: GroupBy;
  sortBy?: SortBy | null;
  filters?: TaskViewFilters | null;
}): TaskGroup[] => {
  const visible = sortTasks(applyViewFilters(tasks, filters), sortBy);

  if (groupBy === "assignee") {
    const groups: TaskGroup[] = members.map((m) => ({
      key: m.id,
      label: m.name,
      pill: NEUTRAL_PILL,
      pillDot: "bg-primary",
      tasks: visible.filter((t) => t.assignee_id === m.id),
      patch: { assignee_id: m.id },
    }));
    groups.push({
      key: "__none__",
      label: "Sem responsável",
      pill: NEUTRAL_PILL,
      pillDot: "bg-muted-foreground",
      tasks: visible.filter((t) => !t.assignee_id || !members.some((m) => m.id === t.assignee_id)),
      patch: { assignee_id: null },
    });
    return groups;
  }

  if (groupBy === "priority") {
    const groups: TaskGroup[] = (Object.keys(TASK_PRIORITY_META) as TaskPriority[]).map((p) => ({
      key: p,
      label: TASK_PRIORITY_META[p].label,
      pill: NEUTRAL_PILL,
      pillDot: TASK_PRIORITY_META[p].flag.replace("text-", "bg-"),
      tasks: visible.filter((t) => t.priority === p),
      patch: { priority: p },
    }));
    groups.push({
      key: "__none__",
      label: "Sem prioridade",
      pill: NEUTRAL_PILL,
      pillDot: "bg-muted-foreground",
      tasks: visible.filter((t) => !t.priority),
      patch: { priority: null },
    });
    return groups;
  }

  return statuses.map((s) => ({
    key: s,
    label: TASK_STATUS_META[s].label,
    pill: TASK_STATUS_META[s].pill,
    pillDot: TASK_STATUS_META[s].pillDot,
    tasks: visible.filter((t) => t.status === s),
    patch: { status: s },
  }));
};
