
export type CostCategory = 'marketing' | 'salarios' | 'impostos' | 'servicos' | 'equipamentos' | 'software' | 'outros';

export interface Cost {
  id: number;
  name: string;
  amount: number;
  category: CostCategory;
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
