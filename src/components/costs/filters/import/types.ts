
import { CostCategory } from "@/types/cost";

export interface Transaction {
  fitid: string;
  name: string;
  amount: number;
  date: string;
  selected: boolean;
  category?: CostCategory; // Mudamos de categories[] para category opcional única
}

export interface ImportService {
  importTransactions: (transactions: Transaction[]) => Promise<number>;
}
