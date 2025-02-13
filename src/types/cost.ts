
export type CostMainCategory = 
  | 'custos_diretos_operacao'
  | 'custos_fixos_administrativos'
  | 'investimentos_desenvolvimento'
  | 'outros_excepcionais';

export type CostSubcategory = 
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

export interface CostTag {
  id: number;
  name: string;
  created_at: string;
}

export interface Cost {
  id: number;
  name: string;
  amount: number;
  main_category: CostMainCategory;
  subcategory: CostSubcategory;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  tags?: CostTag[];
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  subcategory?: CostSubcategory;
  main_category?: CostMainCategory;
  search?: string;
  tags?: string[];
}

interface CategoryOption {
  value: CostSubcategory;
  label: string;
}

interface MainCategoryDefinition {
  label: string;
  categories: CategoryOption[];
}

export const COST_CATEGORIES_HIERARCHY: Record<CostMainCategory, MainCategoryDefinition> = {
  custos_diretos_operacao: {
    label: "Custos Diretos de Operação",
    categories: [
      { value: "marketing_aquisicao", label: "Marketing e Aquisição de Clientes" },
      { value: "custos_vendas", label: "Custos de Vendas" },
      { value: "infraestrutura_operacional", label: "Infraestrutura Operacional" },
    ],
  },
  custos_fixos_administrativos: {
    label: "Custos Fixos e Administrativos",
    categories: [
      { value: "pessoal_administrativo", label: "Pessoal Administrativo" },
      { value: "estrutura_fisica_digital", label: "Estrutura Física/Digital" },
      { value: "taxas_impostos", label: "Taxas e Impostos" },
      { value: "despesas_financeiras", label: "Despesas Financeiras" },
    ],
  },
  investimentos_desenvolvimento: {
    label: "Investimentos e Desenvolvimento",
    categories: [
      { value: "expansao_negocio", label: "Expansão de Negócio" },
      { value: "eventos_networking", label: "Eventos e Networking" },
      { value: "responsabilidade_social", label: "Responsabilidade Social" },
    ],
  },
  outros_excepcionais: {
    label: "Outros/Excepcionais",
    categories: [
      { value: "despesas_corriqueiras", label: "Despesas Corriqueiras" },
      { value: "despesas_nao_planejadas", label: "Despesas Não Planejadas" },
    ],
  },
} as const;

export const MAIN_CATEGORIES = Object.entries(COST_CATEGORIES_HIERARCHY).map(([value, { label }]) => ({
  value: value as CostMainCategory,
  label,
}));

export const ALL_COST_CATEGORIES = Object.values(COST_CATEGORIES_HIERARCHY).flatMap(
  ({ categories }) => categories
);

export const getCategoriesForMainCategory = (mainCategory: CostMainCategory) => {
  return COST_CATEGORIES_HIERARCHY[mainCategory].categories;
};

