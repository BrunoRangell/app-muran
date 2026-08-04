import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStatus } from "@/types/tasks";
import { useToast } from "@/hooks/use-toast";

const LEAD_SELECT =
  "id, name, company, contact_info, status, assignee_id, notes, position, created_at, updated_at";

const PAGE_SIZE = 1000;

export const useLeads = () =>
  useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const rows: Lead[] = [];
      for (let page = 0; ; page += 1) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from("leads")
          .select(LEAD_SELECT)
          .order("position")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        const chunk = (data || []) as Lead[];
        rows.push(...chunk);
        if (chunk.length < PAGE_SIZE) break;
      }
      return rows;
    },
  });

export interface LeadInput {
  name: string;
  company?: string | null;
  contact_info?: string | null;
  status?: LeadStatus;
  assignee_id?: string | null;
  notes?: string | null;
}

export const useCreateLead = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: LeadInput) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("leads")
        .insert({ ...input, created_by: session?.user?.id ?? null } as never)
        .select(LEAD_SELECT)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead criado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar lead", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeadInput> & { id: string }) => {
      const { error } = await supabase.from("leads").update(updates as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) =>
      toast({ title: "Erro ao atualizar lead", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead excluído" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao excluir lead", description: e.message, variant: "destructive" }),
  });
};
