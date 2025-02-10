
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/types/team";
import { useToast } from "@/components/ui/use-toast";

export const useBadges = (teamMemberId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allBadges, isLoading: isLoadingAll } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      console.log("Buscando todos os emblemas");
      
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order('name');

      if (error) {
        console.error("Erro ao buscar todos os emblemas:", error);
        throw error;
      }

      return data as Badge[];
    },
  });

  const { data: userBadges, isLoading: isLoadingUser } = useQuery({
    queryKey: ["badges", teamMemberId],
    queryFn: async () => {
      console.log("Buscando emblemas para o membro:", teamMemberId);
      
      if (!teamMemberId) return [];
      
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("team_member_id", teamMemberId);

      if (error) {
        console.error("Erro ao buscar emblemas do usuário:", error);
        throw error;
      }

      return data as Badge[];
    },
    enabled: !!teamMemberId
  });

  const addBadgeMutation = useMutation({
    mutationFn: async (badge: Omit<Badge, "id" | "created_at">) => {
      console.log("Adicionando emblema:", badge);
      
      const { data, error } = await supabase
        .from("badges")
        .insert([{ ...badge, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["all-badges"] });
      toast({
        title: "Emblema adicionado",
        description: "O emblema foi adicionado com sucesso ao membro da equipe.",
      });
    },
    onError: (error) => {
      console.error("Erro ao adicionar emblema:", error);
      toast({
        title: "Erro ao adicionar emblema",
        description: "Ocorreu um erro ao tentar adicionar o emblema. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async ({ code, memberId }: { code: string; memberId?: string }) => {
      let query = supabase
        .from("badges")
        .delete();

      if (memberId) {
        // Deleta apenas o emblema do membro específico
        query = query.eq("team_member_id", memberId).eq("code", code);
      } else {
        // Deleta todas as instâncias deste emblema
        query = query.eq("code", code);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["all-badges"] });
      toast({
        title: "Emblema removido",
        description: "O emblema foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao remover emblema:", error);
      toast({
        title: "Erro ao remover emblema",
        description: "Não foi possível remover o emblema. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    allBadges,
    userBadges,
    isLoading: isLoadingAll || isLoadingUser,
    addBadge: addBadgeMutation.mutate,
    deleteBadge: deleteBadgeMutation.mutate,
  };
};
