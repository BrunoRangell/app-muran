
import { CostCategory } from "@/types/cost";

export interface Transaction {
  fitid: string;
  name: string;
  amount: number;
  date: string;
  selected: boolean;
  categories?: CostCategory[];
}

export interface ImportService {
  importTransactions: (transactions: Transaction[]) => Promise<number>;
}
