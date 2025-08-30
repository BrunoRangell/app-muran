
export type CostCategory = 
  | 'marketing_vendas'
  | 'pessoal_colaboradores'
  | 'servicos_especializados'
  | 'infraestrutura_operacional'
  | 'impostos_taxas'
  | 'doacoes_acoes_sociais';

export interface Cost {
  id: number;
  name: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  name_customized?: boolean;
  original_name?: string;
  categories?: CostCategory[];
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  categories?: CostCategory[];
  search?: string;
}

export interface CategoryInfo {
  id: CostCategory;
  name: string;
  description: string;
}

export interface CostFormData {
  name: string;
  amount: string;
  categories: CostCategory[];
  date: string;
  description?: string;
}
