
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
  { 
    id: 'marketing', 
    name: 'Marketing', 
    description: 'Campanhas de marketing, mídia paga (Google Ads, Meta Ads), produção de conteúdo, ferramentas de marketing (CRM, automação), Brindes corporativos para equipe e clientes'
  },
  { 
    id: 'vendas', 
    name: 'Vendas', 
    description: 'Salários da equipe comercial, comissões de vendas, treinamentos comerciais, viagens relacionadas a vendas'
  },
  { 
    id: 'plataformas_ferramentas', 
    name: 'Plataformas e ferramentas digitais', 
    description: 'Custos de softwares, hospedagem em nuvem, licenças de ferramentas online (ex: Slack, Zoom), APIs e integrações'
  },
  { 
    id: 'despesas_pessoal', 
    name: 'Despesas com Pessoal', 
    description: 'Salários administrativos, benefícios, treinamentos corporativos, bonificações'
  },
  { 
    id: 'taxas_impostos', 
    name: 'Taxas e impostos', 
    description: 'DAS, DARF, taxas bancárias, impostos municipais/estaduais'
  },
  { 
    id: 'servicos_profissionais', 
    name: 'Serviços profissionais', 
    description: 'Contabilidade, consultorias, assessoria jurídica, serviços de TI externos e outros profissionais especializados'
  },
  { 
    id: 'eventos_networking', 
    name: 'Eventos e Networking', 
    description: 'Participação em eventos corporativos, feiras, conferências, coffee breaks'
  },
  { 
    id: 'acoes_sociais', 
    name: 'Ações sociais / Doações', 
    description: 'Doações para instituições, projetos comunitários, patrocínios sociais'
  }
] as const;

export const useCostCategories = () => {
  return COST_CATEGORIES;
};
