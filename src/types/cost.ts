
export type CostMacroCategory = 'despesas_operacionais' | 'despesas_administrativas' | 'investimentos_e_outros';

export type CostCategory = 'marketing' | 'salarios' | 'comissoes' | 'impostos' | 'alimentacao' | 'ferramentas_e_softwares' | 'viagem_e_hospedagem' | 'equipamentos_e_escritorio' | 'despesas_financeiras' | 'outros' | 'eventos_e_treinamentos' | 'doacoes';

export interface Cost {
  id: number;
  name: string;
  amount: number;
  category: CostCategory;
  macro_category: CostMacroCategory;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  category?: CostCategory;
  macro_category?: CostMacroCategory;
  search?: string;
}

export const COST_CATEGORIES_HIERARCHY = {
  despesas_operacionais: {
    label: "Despesas Operacionais",
    categories: [
      { value: "marketing", label: "Marketing" },
      { value: "salarios", label: "Salários" },
      { value: "comissoes", label: "Comissões" },
      { value: "viagem_e_hospedagem", label: "Viagem e Hospedagem" },
      { value: "alimentacao", label: "Alimentação" },
    ],
  },
  despesas_administrativas: {
    label: "Despesas Administrativas",
    categories: [
      { value: "equipamentos_e_escritorio", label: "Equipamentos e Escritório" },
      { value: "ferramentas_e_softwares", label: "Ferramentas e Softwares" },
      { value: "impostos", label: "Impostos" },
      { value: "despesas_financeiras", label: "Despesas Financeiras" },
    ],
  },
  investimentos_e_outros: {
    label: "Investimentos e Outros",
    categories: [
      { value: "eventos_e_treinamentos", label: "Eventos e Treinamentos" },
      { value: "doacoes", label: "Doações" },
      { value: "outros", label: "Outros" },
    ],
  },
} as const;

export const MACRO_CATEGORIES = Object.entries(COST_CATEGORIES_HIERARCHY).map(([value, { label }]) => ({
  value: value as CostMacroCategory,
  label,
}));

export const ALL_COST_CATEGORIES = Object.values(COST_CATEGORIES_HIERARCHY).flatMap(
  ({ categories }) => categories
);
