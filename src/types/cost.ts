
export type CostCategory = 
  | 'marketing_aquisicao'
  | 'custos_vendas'
  | 'infraestrutura_operacional'
  | 'pessoal_administrativo'
  | 'estrutura_fisica_digital'
  | 'taxas_impostos'
  | 'despesas_financeiras'
  | 'expansao_negocio'
  | 'eventos_networking'
  | 'responsabilidade_social'
  | 'despesas_corriqueiras'
  | 'despesas_nao_planejadas';

export interface Cost {
  id: number;
  name: string;
  amount: number;
  category: CostCategory | null;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  category?: CostCategory;
  search?: string;
}

interface CategoryOption {
  value: CostCategory;
  label: string;
}

export const COST_CATEGORIES: CategoryOption[] = [
  { value: "marketing_aquisicao", label: "Marketing e Aquisição de Clientes" },
  { value: "custos_vendas", label: "Custos de Vendas" },
  { value: "infraestrutura_operacional", label: "Infraestrutura Operacional" },
  { value: "pessoal_administrativo", label: "Pessoal Administrativo" },
  { value: "estrutura_fisica_digital", label: "Estrutura Física/Digital" },
  { value: "taxas_impostos", label: "Taxas e Impostos" },
  { value: "despesas_financeiras", label: "Despesas Financeiras" },
  { value: "expansao_negocio", label: "Expansão de Negócio" },
  { value: "eventos_networking", label: "Eventos e Networking" },
  { value: "responsabilidade_social", label: "Responsabilidade Social" },
  { value: "despesas_corriqueiras", label: "Despesas Corriqueiras" },
  { value: "despesas_nao_planejadas", label: "Despesas Não Planejadas" },
];
