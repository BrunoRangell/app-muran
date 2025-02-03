import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TeamMember } from "@/types/team";

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      console.log("Iniciando busca de todos os membros da equipe...");
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) {
          console.error("Erro ao buscar membros:", error);
          throw error;
        }

        console.log("Total de membros encontrados:", data?.length);
        console.log("Membros:", data);
        
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

      console.log("Buscando dados do usuário atual:", session.user.email);
      
      const { data: teamMember, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error("Erro ao buscar usuário atual:", error);
        throw error;
      }

      console.log("Dados do usuário atual:", teamMember);
      return teamMember as TeamMember;
    },
  });
};