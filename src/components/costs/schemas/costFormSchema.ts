
import { z } from "zod";
import { CostCategory, CategoryInfo } from "@/types/cost";
import { COST_CATEGORIES } from "@/components/costs/constants/categories";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  categories: z.array(z.enum([
    'marketing_vendas',
    'pessoal_colaboradores',
    'servicos_especializados',
    'infraestrutura_operacional',
    'impostos_taxas',
    'doacoes_acoes_sociais'
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
  return COST_CATEGORIES;
};
