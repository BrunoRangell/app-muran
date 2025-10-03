import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook seguro para verificar roles do usuário usando user_roles table
 * NUNCA usa team_members.permission para evitar escalação de privilégios
 */
export const useUserRole = () => {
  return useQuery({
    queryKey: ["user_role"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { isAdmin: false, isTeamMember: false, userId: null };
      }

      try {
        // Buscar roles da tabela user_roles (fonte única de verdade)
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (error) {
          console.error("Erro ao verificar roles do usuário:", error);
          return { isAdmin: false, isTeamMember: false, userId: session.user.id };
        }

        const rolesList = roles?.map(r => r.role) || [];
        const isAdmin = rolesList.includes('admin');
        const isTeamMember = rolesList.includes('admin') || rolesList.includes('member');

        console.log("✅ Roles do usuário verificados:", { 
          userId: session.user.id,
          roles: rolesList,
          isAdmin, 
          isTeamMember 
        });

        return {
          isAdmin,
          isTeamMember,
          userId: session.user.id,
          roles: rolesList
        };
      } catch (error) {
        console.error("Erro ao verificar roles:", error);
        return { isAdmin: false, isTeamMember: false, userId: session.user.id };
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 1
  });
};
