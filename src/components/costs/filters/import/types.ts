
import { CostMainCategory, CostSubcategory } from "@/types/cost";

export interface Transaction {
  fitid: string;
  name: string;
  amount: number;
  date: string;
  selected: boolean;
  mainCategory?: CostMainCategory;
  subcategory?: CostSubcategory;
}

export interface ImportService {
  importTransactions: (transactions: Transaction[]) => Promise<number>;
}
