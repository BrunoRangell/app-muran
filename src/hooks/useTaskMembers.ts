import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskMember, TaskMemberRole, TaskPermissionLevel, TaskSpaceAccess } from "@/types/tasks";
import { useToast } from "@/hooks/use-toast";

const SELECT = "id, name, email, color, avatar_url, created_at, auth_user_id, role";

/** Membros do módulo /tarefas (tabela task_members, isolada de team_members). */
export const useTaskMembers = () =>
  useQuery({
    queryKey: ["task-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_members").select(SELECT).order("name");
      if (error) throw error;
      return (data || []) as TaskMember[];
    },
  });

/** task_members do usuário logado (via task_members.auth_user_id). */
export const useCurrentTaskMember = () =>
  useQuery({
    queryKey: ["task-members", "current"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("task_members")
        .select(SELECT)
        .eq("auth_user_id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as TaskMember | null;
    },
  });

export interface TaskMemberInput {
  name: string;
  email?: string | null;
  color?: string | null;
  avatar_url?: string | null;
}

export const useCreateTaskMember = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: TaskMemberInput) => {
      const { data, error } = await supabase
        .from("task_members")
        .insert(input as never)
        .select(SELECT)
        .single();
      if (error) throw error;
      return data as TaskMember;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-members"] });
      toast({ title: "Membro adicionado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao adicionar membro", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateTaskMember = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskMemberInput> & { id: string }) => {
      const { error } = await supabase.from("task_members").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-members"] });
      toast({ title: "Membro atualizado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar membro", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteTaskMember = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-members"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Membro removido" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao remover membro", description: e.message, variant: "destructive" }),
  });
};

/** Acessos por espaço (usado para convidados). */
export const useTaskSpaceAccess = () =>
  useQuery({
    queryKey: ["task-space-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_space_access")
        .select("id, task_member_id, space_id, permission_level, granted_by, created_at");
      if (error) throw error;
      return (data || []) as TaskSpaceAccess[];
    },
  });

export interface SaveTaskMemberAccessInput {
  member_id?: string | null;
  name: string;
  email?: string | null;
  color?: string | null;
  role: TaskMemberRole | null;
  space_ids?: string[];
  permission_level?: TaskPermissionLevel;
}

/**
 * Cria/atualiza membro com papel e acessos de espaço, enviando convite por e-mail
 * quando um papel é atribuído (edge function `tasks-invite-member`).
 */
export const useSaveTaskMemberAccess = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: SaveTaskMemberAccessInput) => {
      const { data, error } = await supabase.functions.invoke("tasks-invite-member", {
        body: {
          ...input,
          redirect_to: `${window.location.origin}/tarefas/definir-senha`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { member_id: string; invited: boolean };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["task-members"] });
      qc.invalidateQueries({ queryKey: ["task-space-access"] });
      qc.invalidateQueries({ queryKey: ["task-auth"] });
      toast({
        title: data?.invited ? "Convite enviado por e-mail" : "Membro salvo",
        description: data?.invited
          ? "O usuário receberá um link para definir a senha."
          : undefined,
      });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao salvar membro", description: e.message, variant: "destructive" }),
  });
};

