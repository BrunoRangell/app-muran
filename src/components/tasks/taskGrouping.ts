import {
  GroupBy,
  SortValue,
  Task,
  TaskMember,
  TaskPriority,
  TaskStatus,
  TaskViewFilters,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  assigneeIdsOf,
  parseSort,
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

/** Normaliza filtros (aceita o formato legado de uma opção só). */
export const normalizeFilters = (filters?: TaskViewFilters | null) => {
  const assignee_ids = filters?.assignee_ids ?? (filters?.assignee_id ? [filters.assignee_id] : []);
  const priorities = filters?.priorities ?? (filters?.priority ? [filters.priority] : []);
  const statuses = filters?.statuses ?? [];
  return { assignee_ids, priorities, statuses };
};

export const countActiveFilters = (filters?: TaskViewFilters | null) => {
  const f = normalizeFilters(filters);
  return f.assignee_ids.length + f.priorities.length + f.statuses.length;
};

export const applyViewFilters = (tasks: Task[], filters?: TaskViewFilters | null) => {
  const f = normalizeFilters(filters);
  if (!f.assignee_ids.length && !f.priorities.length && !f.statuses.length) return tasks;
  return tasks.filter((t) => {
    if (f.assignee_ids.length) {
      const ids = assigneeIdsOf(t);
      /** Corresponde se QUALQUER responsável da tarefa estiver selecionado. */
      if (!ids.some((id) => f.assignee_ids.includes(id))) return false;
    }
    if (f.priorities.length && (!t.priority || !f.priorities.includes(t.priority))) return false;
    if (f.statuses.length && !f.statuses.includes(t.status)) return false;
    return true;
  });
};


const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
  baixa: 3,
};

export const sortTasks = (tasks: Task[], sortBy?: SortValue | null) => {
  const { field, dir } = parseSort(sortBy);
  if (!field) return [...tasks];
  const mult = dir === "desc" ? -1 : 1;
  const list = [...tasks];
  if (field === "due") {
    return list.sort(
      (a, b) =>
        mult * (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31")
    );
  }
  if (field === "priority") {
    return list.sort(
      (a, b) =>
        mult *
        ((a.priority ? PRIORITY_ORDER[a.priority] : 9) - (b.priority ? PRIORITY_ORDER[b.priority] : 9))
    );
  }
  if (field === "created") {
    return list.sort((a, b) => mult * a.created_at.localeCompare(b.created_at));
  }
  if (field === "name") {
    return list.sort((a, b) => mult * a.title.localeCompare(b.title, "pt-BR"));
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
  sortBy?: SortValue | null;
  filters?: TaskViewFilters | null;
}): TaskGroup[] => {
  const visible = sortTasks(applyViewFilters(tasks, filters), sortBy);

  if (groupBy === "none") {
    return [
      {
        key: "__all__",
        label: "Tarefas",
        pill: NEUTRAL_PILL,
        pillDot: "bg-primary",
        tasks: visible,
        patch: null,
      },
    ];
  }

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

  if (groupBy === "due") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayStr = iso(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + (7 - ((today.getDay() + 6) % 7)) - 1);
    const weekEndStr = iso(weekEnd);

    const bucketOf = (due: string | null) => {
      if (!due) return "none";
      if (due < todayStr) return "overdue";
      if (due === todayStr) return "today";
      if (due <= weekEndStr) return "week";
      return "later";
    };

    const buckets: { key: string; label: string; dot: string }[] = [
      { key: "overdue", label: "Atrasado", dot: "bg-red-500" },
      { key: "today", label: "Hoje", dot: "bg-amber-500" },
      { key: "week", label: "Esta semana", dot: "bg-sky-500" },
      { key: "later", label: "Mais tarde", dot: "bg-emerald-500" },
      { key: "none", label: "Sem prazo", dot: "bg-muted-foreground" },
    ];

    return buckets.map((b) => ({
      key: b.key,
      label: b.label,
      pill: NEUTRAL_PILL,
      pillDot: b.dot,
      tasks: visible.filter((t) => bucketOf(t.due_date) === b.key),
      patch: null,
    }));
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
