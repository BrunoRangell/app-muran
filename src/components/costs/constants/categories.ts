import { CostCategory, CategoryInfo } from "@/types/cost";

export const COST_CATEGORIES: CategoryInfo[] = [
  {
    id: 'marketing' as CostCategory,
    name: 'Marketing',
    description: 'Gastos relacionados a marketing e publicidade'
  },
  {
    id: 'vendas' as CostCategory,
    name: 'Vendas',
    description: 'Despesas do processo de vendas'
  },
  {
    id: 'plataformas_ferramentas' as CostCategory,
    name: 'Plataformas e Ferramentas',
    description: 'Softwares, plataformas e ferramentas de trabalho'
  },
  {
    id: 'despesas_pessoal' as CostCategory,
    name: 'Despesas de Pessoal',
    description: 'Salários, benefícios e gastos com funcionários'
  },
  {
    id: 'taxas_impostos' as CostCategory,
    name: 'Taxas e Impostos',
    description: 'Impostos, taxas governamentais e obrigações fiscais'
  },
  {
    id: 'servicos_profissionais' as CostCategory,
    name: 'Serviços Profissionais',
    description: 'Consultoria, assessoria e serviços terceirizados'
  },
  {
    id: 'eventos_networking' as CostCategory,
    name: 'Eventos e Networking',
    description: 'Participação em eventos, networking e capacitação'
  },
  {
    id: 'acoes_sociais' as CostCategory,
    name: 'Ações Sociais',
    description: 'Investimentos em responsabilidade social e ambiental'
  }
];