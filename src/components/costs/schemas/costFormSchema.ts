
import { z } from "zod";
import { CostCategory, CostMacroCategory, COST_CATEGORIES_HIERARCHY } from "@/types/cost";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  macro_category: z.enum(['despesas_operacionais', 'despesas_administrativas', 'investimentos_e_outros'] as const),
  category: z.enum([
    "marketing",
    "salarios",
    "comissoes",
    "impostos",
    "alimentacao",
    "ferramentas_e_softwares",
    "viagem_e_hospedagem",
    "equipamentos_e_escritorio",
    "despesas_financeiras",
    "outros",
    "eventos_e_treinamentos",
    "doacoes"
  ] as const),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

export type CostFormData = z.infer<typeof costFormSchema>;

export interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const getCategoriesForMacroCategory = (macroCategory: CostMacroCategory) => {
  return COST_CATEGORIES_HIERARCHY[macroCategory].categories;
};
