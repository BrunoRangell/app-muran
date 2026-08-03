import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientTaskList, InternalArea, Task, TaskComment } from "@/types/tasks";
import { useToast } from "@/hooks/use-toast";

const TASK_SELECT =
  "id, list_id, is_internal, internal_area, title, description, status, assignee_id, due_date, priority, position, created_by, created_at, updated_at";

export const useClientTaskLists = (clientId?: string) =>
  useQuery({
    queryKey: ["client-task-lists", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_task_lists")
        .select("id, client_id, name, position, created_at")
        .eq("client_id", clientId!)
        .order("position");
      if (error) throw error;
      return (data || []) as ClientTaskList[];
    },
  });

export const useListTasks = (listId?: string) =>
  useQuery({
    queryKey: ["tasks", "list", listId],
    enabled: !!listId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("list_id", listId!)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return (data || []) as Task[];
    },
  });

export const useInternalTasks = (area?: InternalArea) =>
  useQuery({
    queryKey: ["tasks", "internal", area],
    enabled: !!area,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("is_internal", true)
        .eq("internal_area", area!)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return (data || []) as Task[];
    },
  });

export interface MyTaskRow extends Task {
  client_task_lists: { name: string; clients: { company_name: string } | null } | null;
}

export const useMyTasks = (teamMemberId?: string) =>
  useQuery({
    queryKey: ["tasks", "mine", teamMemberId],
    enabled: !!teamMemberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`${TASK_SELECT}, client_task_lists ( name, clients ( company_name ) )`)
        .eq("assignee_id", teamMemberId!)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as MyTaskRow[];
    },
  });

const invalidateTasks = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["tasks"] });
};

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: Task["status"];
  assignee_id?: string | null;
  due_date?: string | null;
  priority?: Task["priority"];
  list_id?: string | null;
  is_internal?: boolean;
  internal_area?: InternalArea | null;
}

export const useCreateTask = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: TaskInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...input, created_by: session?.user?.id ?? null } as never)
        .select(TASK_SELECT)
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      invalidateTasks(qc);
      toast({ title: "Tarefa criada" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar tarefa", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates as never)
        .eq("id", id)
        .select(TASK_SELECT)
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => invalidateTasks(qc),
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar tarefa", description: e.message, variant: "destructive" }),
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
