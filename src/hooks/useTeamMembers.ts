import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TeamMember } from "@/types/team";

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      console.log("Buscando membros da equipe...");
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('start_date', { ascending: true })
          .order('name');

        if (error) {
          console.error("Erro ao buscar membros:", error);
          throw error;
        }

        console.log("Membros encontrados:", data);
        return data as TeamMember[];
      } catch (error) {
        console.error("Erro na consulta de membros:", error);
        throw error;
      }
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["current_user"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', session.user.email)
        .single();

      return teamMember as TeamMember;
    },
  });
};