
import { z } from "zod";
import { CostMainCategory, CostSubcategory } from "@/types/cost";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  main_category: z.enum(['custos_diretos_operacao', 'custos_fixos_administrativos', 'investimentos_desenvolvimento', 'outros_excepcionais'] as const),
  subcategory: z.enum([
    "marketing_aquisicao",
    "custos_vendas",
    "infraestrutura_operacional",
    "pessoal_administrativo",
    "estrutura_fisica_digital",
    "taxas_impostos",
    "despesas_financeiras",
    "expansao_negocio",
    "eventos_networking",
    "responsabilidade_social",
    "despesas_corriqueiras",
    "despesas_nao_planejadas"
  ] as const),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CostFormData = z.infer<typeof costFormSchema>;

export interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
