import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TaskMemberRole } from "@/types/tasks";

export interface TaskAuthState {
  userId: string | null;
  /** task_members.id do usuário logado */
  memberId: string | null;
  role: TaskMemberRole | null;
  isTaskAdmin: boolean;
  isTaskMember: boolean;
  /** convidado com pelo menos um espaço liberado */
  isTaskGuest: boolean;
  /** tem acesso ao módulo /tarefas (member, admin ou guest com grant) */
  hasTasksAccess: boolean;
  /** possui papel no app principal (user_roles) */
  isAppUser: boolean;
  /** só tem acesso ao módulo de tarefas — nunca deve ver clientes/financeiro */
  isTasksOnlyUser: boolean;
}

const EMPTY: TaskAuthState = {
  userId: null,
  memberId: null,
  role: null,
  isTaskAdmin: false,
  isTaskMember: false,
  isTaskGuest: false,
  hasTasksAccess: false,
  isAppUser: false,
  isTasksOnlyUser: false,
};

/** Permissões do módulo de tarefas — independentes do controle do app principal. */
export const useTaskAuth = () =>
  useQuery({
    queryKey: ["task-auth"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async (): Promise<TaskAuthState> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return EMPTY;

      const [{ data: member }, { data: appRoles }] = await Promise.all([
        supabase
          .from("task_members")
          .select("id, role")
          .eq("auth_user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const role = ((member as { role?: TaskMemberRole | null } | null)?.role ??
        null) as TaskMemberRole | null;
      const memberId = (member as { id?: string } | null)?.id ?? null;

      let guestGrants = 0;
      if (role === "guest" && memberId) {
        const { count } = await supabase
          .from("task_space_access")
          .select("id", { count: "exact", head: true })
          .eq("task_member_id", memberId);
        guestGrants = count ?? 0;
      }

      const isTaskAdmin = role === "admin";
      const isTaskMember = role === "admin" || role === "member";
      const isTaskGuest = role === "guest" && guestGrants > 0;
      const isAppUser = (appRoles?.length ?? 0) > 0;

      return {
        userId: user.id,
        memberId,
        role,
        isTaskAdmin,
        isTaskMember,
        isTaskGuest,
        hasTasksAccess: isTaskMember || isTaskGuest,
        isAppUser,
        isTasksOnlyUser: (isTaskMember || isTaskGuest) && !isAppUser,
      };
    },
  });
