
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TeamMember } from "@/types/team";

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      console.log("Iniciando busca de todos os membros da equipe...");
      try {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .order('start_date', { ascending: true })
          .order('name', { ascending: true });

        if (membersError) {
          console.error("Erro ao buscar membros:", membersError);
          throw membersError;
        }

        // Buscar emblemas para cada membro
        const membersWithBadges = await Promise.all(
          members.map(async (member) => {
            const { data: badges, error: badgesError } = await supabase
              .from('badges')
              .select('*')
              .eq('team_member_id', member.id);

            if (badgesError) {
              console.error("Erro ao buscar emblemas do membro:", badgesError);
              return member;
            }

            return { ...member, badges };
          })
        );

        console.log("Total de membros encontrados:", membersWithBadges.length);
        console.log("Membros com emblemas:", membersWithBadges);
        
        return membersWithBadges as TeamMember[];
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

      // Buscar emblemas do usuário atual
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('team_member_id', teamMember.id);

      if (badgesError) {
        console.error("Erro ao buscar emblemas do usuário atual:", badgesError);
        return teamMember;
      }

      const memberWithBadges = { ...teamMember, badges };
      console.log("Dados do usuário atual:", memberWithBadges);
      
      return memberWithBadges as TeamMember;
    },
  });
};
