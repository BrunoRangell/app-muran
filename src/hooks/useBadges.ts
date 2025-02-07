
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/types/team";
import { useToast } from "@/components/ui/use-toast";

export const useBadges = (teamMemberId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: badges, isLoading } = useQuery({
    queryKey: ["badges", teamMemberId],
    queryFn: async () => {
      console.log("Buscando emblemas para o membro:", teamMemberId);
      
      if (!teamMemberId) return [];
      
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("team_member_id", teamMemberId);

      if (error) {
        console.error("Erro ao buscar emblemas:", error);
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
      toast({
        title: "Sucesso!",
        description: "Emblema adicionado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao adicionar emblema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o emblema.",
        variant: "destructive",
      });
    },
  });

  const removeBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      console.log("Removendo emblema:", badgeId);
      
      const { error } = await supabase
        .from("badges")
        .delete()
        .eq("id", badgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      toast({
        title: "Sucesso!",
        description: "Emblema removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao remover emblema:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o emblema.",
        variant: "destructive",
      });
    },
  });

  return {
    badges,
    isLoading,
    addBadge: addBadgeMutation.mutate,
    removeBadge: removeBadgeMutation.mutate,
  };
};
