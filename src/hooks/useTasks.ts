import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InternalArea, Task, TaskComment, TaskRecurrence } from "@/types/tasks";
import { useToast } from "@/hooks/use-toast";
import { useShowCompleted } from "@/components/tasks/taskPreferences";
import { nextDueDate } from "@/components/tasks/recurrence";

const TASK_SELECT =
  "id, list_id, is_internal, internal_area, title, description, status, assignee_id, due_date, priority, position, created_by, created_at, updated_at, recurrence, task_assignees ( member_id )";

/** Tamanho de página do PostgREST (limite padrão do Supabase é 1000). */
const PAGE_SIZE = 1000;

/**
 * Busca TODAS as linhas de uma query paginando com `.range()`, evitando o corte
 * silencioso em 1000 registros do PostgREST.
 */
async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; ; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const chunk = (data || []) as T[];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }
  return rows;
}

const sel = (s: string): string => s;

/** Normaliza o embed de `task_assignees` em `assignee_ids`. */
const normalizeTasks = <T extends Task>(rows: T[]): T[] =>
  rows.map((row) => {
    const ids = (row.task_assignees ?? []).map((a) => a.member_id);
    return { ...row, assignee_ids: ids.length ? ids : row.assignee_id ? [row.assignee_id] : [] };
  });

/**
 * Sincroniza `task_assignees` com a lista desejada (insere as novas, remove as
 * desmarcadas) e mantém `tasks.assignee_id` apontando para o primeiro (legado).
 */
async function syncAssignees(taskId: string, memberIds: string[]) {
  const unique = Array.from(new Set(memberIds));
  const { data: current, error: readError } = await supabase
    .from("task_assignees")
    .select("id, member_id")
    .eq("task_id", taskId);
  if (readError) throw readError;

  const existing = (current || []) as { id: string; member_id: string }[];
  const toRemove = existing.filter((row) => !unique.includes(row.member_id)).map((r) => r.id);
  const toAdd = unique.filter((id) => !existing.some((row) => row.member_id === id));

  if (toRemove.length) {
    const { error } = await supabase.from("task_assignees").delete().in("id", toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase
      .from("task_assignees")
      .insert(toAdd.map((member_id) => ({ task_id: taskId, member_id })) as never);
    if (error) throw error;
  }

  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: unique[0] ?? null } as never)
    .eq("id", taskId);
  if (error) throw error;
}


export const useListTasks = (listId?: string) => {
  const [showCompleted] = useShowCompleted();
  return useQuery({
    queryKey: ["tasks", "list", listId, showCompleted],
    enabled: !!listId,
    queryFn: async () =>
      normalizeTasks(
        await fetchAllPages<Task>((from, to) => {
          let q = supabase
            .from("tasks")
            .select(sel(TASK_SELECT))
            .eq("list_id", listId!);
          if (!showCompleted) q = q.neq("status", "concluido");
          return q.order("position").order("created_at").range(from, to);
        })
      ),
  });
};

/** Todas as tarefas de todas as listas (visão consolidada "Todas as tarefas"). */
export const useAllTasks = (enabled = true) => {
  const [showCompleted] = useShowCompleted();
  return useQuery({
    queryKey: ["tasks", "all", showCompleted],
    enabled,
    queryFn: async () =>
      normalizeTasks(
        await fetchAllPages<Task>((from, to) => {
          let q = supabase
            .from("tasks")
            .select(sel(`${TASK_SELECT}, task_lists ( name, task_folders ( name ) )`));
          if (!showCompleted) q = q.neq("status", "concluido");
          return q
            .order("due_date", { ascending: true, nullsFirst: false })
            .order("created_at")
            .range(from, to);
        })
      ),
  });
};

export const useInternalTasks = (area?: InternalArea) => {
  const [showCompleted] = useShowCompleted();
  return useQuery({
    queryKey: ["tasks", "internal", area, showCompleted],
    enabled: !!area,
    queryFn: async () =>
      normalizeTasks(
        await fetchAllPages<Task>((from, to) => {
          let q = supabase
            .from("tasks")
            .select(sel(TASK_SELECT))
            .eq("is_internal", true)
            .eq("internal_area", area!);
          if (!showCompleted) q = q.neq("status", "concluido");
          return q.order("position").order("created_at").range(from, to);
        })
      ),
  });
};

export interface MyTaskRow extends Task {
  task_lists: { name: string; task_folders: { name: string } | null } | null;
}

/**
 * Tarefas de um membro do módulo (task_members). Considera TODOS os
 * responsáveis (`task_assignees`), não apenas o campo legado `assignee_id`.
 */
export const useMyTasks = (taskMemberId?: string) => {
  const [showCompleted] = useShowCompleted();
  return useQuery({
    queryKey: ["tasks", "mine", taskMemberId, showCompleted],
    enabled: !!taskMemberId,
    queryFn: async () => {
      const links = await fetchAllPages<{ task_id: string }>((from, to) =>
        supabase
          .from("task_assignees")
          .select("task_id")
          .eq("member_id", taskMemberId!)
          .range(from, to)
      );
      const ids = Array.from(new Set(links.map((l) => l.task_id)));
      if (!ids.length) return [];

      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));

      const pages = await Promise.all(
        chunks.map(async (chunk) => {
          let q = supabase
            .from("tasks")
            .select(sel(`${TASK_SELECT}, task_lists ( name, task_folders ( name ) )`))
            .in("id", chunk);
          if (!showCompleted) q = q.neq("status", "concluido");
          const { data, error } = await q.order("due_date", {
            ascending: true,
            nullsFirst: false,
          });
          if (error) throw new Error(error.message);
          return (data || []) as unknown as MyTaskRow[];
        })
      );

      return normalizeTasks(pages.flat()).sort((a, b) =>
        (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31")
      );
    },
  });
};

const invalidateTasks = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["tasks"] });
};

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: Task["status"];
  /** Legado (primeiro responsável). Prefira `assignee_ids`. */
  assignee_id?: string | null;
  /** Lista completa de responsáveis (gravada em `task_assignees`). */
  assignee_ids?: string[];
  due_date?: string | null;
  priority?: Task["priority"];
  list_id?: string | null;
  is_internal?: boolean;
  internal_area?: InternalArea | null;
  recurrence?: TaskRecurrence | null;
}

export const useCreateTask = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ assignee_ids, ...input }: TaskInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      const ids = assignee_ids ?? (input.assignee_id ? [input.assignee_id] : []);
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...input,
          assignee_id: ids[0] ?? null,
          created_by: session?.user?.id ?? null,
        } as never)
        .select(TASK_SELECT)
        .single();
      if (error) throw error;
      const task = data as unknown as Task;
      if (ids.length) await syncAssignees(task.id, ids);
      return task;
    },
    onSuccess: () => {
      invalidateTasks(qc);
      toast({ title: "Tarefa criada" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar tarefa", description: e.message, variant: "destructive" }),
  });
};

/**
 * Atualiza uma tarefa. Tarefas recorrentes NÃO são concluídas: ao marcar
 * `concluido`, a data de vencimento avança para o próximo ciclo e o status
 * volta para `pendente` (igual ao ClickUp). Quando a recorrência expira
 * (`end_date` ultrapassado), a conclusão acontece normalmente.
 *
 * Responsáveis: passe `assignee_ids` para sincronizar `task_assignees`.
 * `assignee_id` (legado) substitui a lista por um único responsável.
 */
export const useUpdateTask = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, assignee_ids, ...updates }: Partial<TaskInput> & { id: string }) => {
      let patch: Record<string, unknown> = { ...updates };

      if (updates.status === "concluido" && updates.recurrence === undefined) {
        const { data: current } = await supabase
          .from("tasks")
          .select("due_date, recurrence")
          .eq("id", id)
          .single();
        const rule = (current?.recurrence ?? null) as unknown as TaskRecurrence | null;
        if (rule) {
          const next = nextDueDate(
            (updates.due_date ?? current?.due_date ?? null) as string | null,
            rule
          );
          if (next) patch = { ...patch, status: "pendente", due_date: next };
        }
      }

      const nextAssignees =
        assignee_ids ?? (updates.assignee_id !== undefined
          ? updates.assignee_id
            ? [updates.assignee_id]
            : []
          : null);

      let task: Task | null = null;
      if (Object.keys(patch).length) {
        const { data, error } = await supabase
          .from("tasks")
          .update(patch as never)
          .eq("id", id)
          .select(TASK_SELECT)
          .single();
        if (error) throw error;
        task = data as unknown as Task;
      }

      if (nextAssignees) await syncAssignees(id, nextAssignees);

      if (!task) {
        const { data, error } = await supabase
          .from("tasks")
          .select(TASK_SELECT)
          .eq("id", id)
          .single();
        if (error) throw error;
        task = data as unknown as Task;
      }
      return normalizeTasks([task])[0];
    },
    onSuccess: (task, vars) => {
      invalidateTasks(qc);
      if (vars.status === "concluido" && task.status === "pendente") {
        toast({
          title: "Tarefa recorrente reagendada",
          description: `Próximo vencimento: ${task.due_date}`,
        });
      }
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar tarefa", description: e.message, variant: "destructive" }),
  });
};


/**
 * Persiste a ordem manual das tarefas dentro de um grupo/coluna.
 * Recebe os ids na ordem final desejada e grava `position` sequencial.
 */
export const useReorderTasks = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i += 1) {
        const { error } = await supabase
          .from("tasks")
          .update({ position: i } as never)
          .eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidateTasks(qc),
    onError: (e: Error) =>
      toast({ title: "Erro ao reordenar tarefas", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteTask = () => {

  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateTasks(qc);
      toast({ title: "Tarefa excluída" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir tarefa", description: e.message, variant: "destructive" }),
  });
};

export const useTaskComments = (taskId?: string) =>
  useQuery({
    queryKey: ["task-comments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select("id, task_id, author_id, content, created_at")
        .eq("task_id", taskId!)
        .order("created_at");
      if (error) throw error;
      return (data || []) as TaskComment[];
    },
  });

/** id do usuário autenticado (para permitir excluir o próprio comentário). */
export const useCurrentAuthUserId = () =>
  useQuery({
    queryKey: ["auth-user-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: 5 * 60 * 1000,
  });

export const useDeleteTaskComment = (taskId?: string) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] });
      toast({ title: "Comentário excluído" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir comentário", description: e.message, variant: "destructive" }),
  });
};

export const useAddTaskComment = (taskId?: string) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("task_comments")
        .insert({ task_id: taskId!, content, author_id: session.user.id } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
    onError: (e: Error) =>
      toast({ title: "Erro ao comentar", description: e.message, variant: "destructive" }),
  });
};
