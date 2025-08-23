import { CostCategory, CategoryInfo } from "@/types/cost";

export const COST_CATEGORIES: CategoryInfo[] = [
  {
    id: 'marketing_vendas' as CostCategory,
    name: 'Marketing & Vendas',
    description: 'Atrair clientes e aumentar as vendas: anúncios online, comissões de vendas, eventos de networking, patrocínios comerciais'
  },
  {
    id: 'pessoal_colaboradores' as CostCategory,
    name: 'Pessoal & Colaboradores',
    description: 'Pessoas ligadas diretamente à operação: Salários, prestadores de serviço, bonificações por serviço'
  },
  {
    id: 'servicos_especializados' as CostCategory,
    name: 'Serviços Especializados',
    description: 'Serviços que não são ligados à operação: Contabilidade, jurídico, consultoria'
  },
  {
    id: 'infraestrutura_operacional' as CostCategory,
    name: 'Infraestrutura & Operacional',
    description: 'Manter o funcionamento do dia a dia: Escritório, plataformas, ferramentas digitais, materiais'
  },
  {
    id: 'impostos_taxas' as CostCategory,
    name: 'Impostos & Taxas',
    description: 'Impostos, contribuições, taxas obrigatórias'
  },
  {
    id: 'doacoes_acoes_sociais' as CostCategory,
    name: 'Doações e Ações Sociais',
    description: 'Doações para instituições, projetos comunitários, patrocínios sociais'
  }
];