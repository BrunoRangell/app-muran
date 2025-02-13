
import { CostCategory } from "@/types/cost";

export interface Transaction {
  fitid: string;
  name: string;
  amount: number;
  date: string;
  selected: boolean;
  category?: CostCategory;
}

export interface ImportService {
  importTransactions: (transactions: Transaction[]) => Promise<number>;
}
