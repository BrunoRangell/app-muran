
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CostCategory, CategoryInfo } from "@/types/cost";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  categories: z.array(z.enum([
    'marketing',
    'vendas',
    'plataformas_ferramentas',
    'despesas_pessoal',
    'taxas_impostos',
    'servicos_profissionais',
    'eventos_networking',
    'acoes_sociais'
  ] as const)).min(1, "Selecione pelo menos uma categoria"),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

export type CostFormData = z.infer<typeof costFormSchema>;

export interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const useCostCategories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["cost-categories"],
    queryFn: async () => {
      console.log("Buscando categorias...");
      const { data, error } = await supabase
        .from("cost_categories")
        .select("*")
        .order('name');

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        throw error;
      }

      if (!data) {
        console.log("Nenhuma categoria encontrada, retornando array vazio");
        return [];
      }

      console.log("Categorias retornadas:", data);
      return data as CategoryInfo[];
    },
    initialData: [] as CategoryInfo[],
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return categories;
};
