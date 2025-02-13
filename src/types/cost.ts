
export type CostCategory = 
  | 'marketing'
  | 'vendas'
  | 'plataformas_ferramentas'
  | 'despesas_pessoal'
  | 'taxas_impostos'
  | 'servicos_profissionais'
  | 'eventos_networking'
  | 'acoes_sociais';

export interface Cost {
  id: number;
  name: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  categories?: CostCategory[];
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  category?: CostCategory;
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
