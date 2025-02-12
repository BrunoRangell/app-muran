
export type CostCategory = 'marketing' | 'salarios' | 'comissoes' | 'impostos' | 'alimentacao' | 'ferramentas_e_softwares' | 'viagem_e_hospedagem' | 'equipamentos_e_escritorio' | 'despesas_financeiras' | 'outros' | 'eventos_e_treinamentos' | 'doacoes';

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
