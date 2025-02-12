
import { z } from "zod";
import { CostCategory } from "@/types/cost";

export const costFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório"),
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
    "outros"
  ] as const),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
});

export type CostFormData = z.infer<typeof costFormSchema>;

export interface NewCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const costCategories: { value: CostCategory; label: string }[] = [
  { value: "marketing", label: "Marketing" },
  { value: "salarios", label: "Salários" },
  { value: "comissoes", label: "Comissões" },
  { value: "impostos", label: "Impostos" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "ferramentas_e_softwares", label: "Ferramentas e Softwares" },
  { value: "viagem_e_hospedagem", label: "Viagem e Hospedagem" },
  { value: "equipamentos_e_escritorio", label: "Equipamentos e Escritório" },
  { value: "despesas_financeiras", label: "Despesas Financeiras" },
  { value: "outros", label: "Outros" },
];
