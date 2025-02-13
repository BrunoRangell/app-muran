
import { z } from "zod";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
  category: z.enum([
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
  ] as const).nullable(),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

export type CostFormData = z.infer<typeof costFormSchema>;

export interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
