
import { z } from "zod";
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

export const COST_CATEGORIES: CategoryInfo[] = [
  { id: 'marketing', name: 'Marketing', description: 'Gastos com publicidade e marketing' },
  { id: 'vendas', name: 'Vendas', description: 'Custos relacionados a vendas' },
  { id: 'plataformas_ferramentas', name: 'Plataformas e Ferramentas', description: 'Assinaturas e ferramentas' },
  { id: 'despesas_pessoal', name: 'Despesas com Pessoal', description: 'Custos com equipe' },
  { id: 'taxas_impostos', name: 'Taxas e Impostos', description: 'Pagamentos de impostos e taxas' },
  { id: 'servicos_profissionais', name: 'Serviços Profissionais', description: 'Serviços terceirizados' },
  { id: 'eventos_networking', name: 'Eventos e Networking', description: 'Eventos e relacionamentos' },
  { id: 'acoes_sociais', name: 'Ações Sociais', description: 'Investimentos sociais' }
] as const;

export const useCostCategories = () => {
  return COST_CATEGORIES;
};
