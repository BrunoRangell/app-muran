
import { toast } from "sonner";
import { parseOFX } from "./ofxParser";
import { parseCSV, detectCSVColumns } from "./parsers/csvParser";
import { Transaction } from "./types";

export function useTransactionParser() {

  const parseOFXFile = async (file: File): Promise<Transaction[]> => {
    try {
      const text = await file.text();
      console.log("Processando arquivo OFX...");
      
      const ofx = parseOFX(text);
      console.log("Arquivo OFX parseado:", ofx);
      
      if (!ofx.bankAccounts?.[0]?.transactions) {
        throw new Error("Nenhuma transação encontrada no arquivo");
      }

      // Processar transações
      const transactions = ofx.bankAccounts[0].transactions.map(t => ({
        fitid: t.fitId,
        name: t.name,
        originalName: t.name, // Salvamos o nome original
        amount: Math.abs(Number(t.amount)),
        date: t.date,
        selected: true,
        // Categoria agora é opcional
      }));

      console.log("Transações processadas:", transactions);
      return transactions;
    } catch (error) {
      console.error("Erro ao processar arquivo OFX:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo");
      throw error;
    }
  };

  const parseCSVFile = async (file: File, options: any): Promise<Transaction[]> => {
    try {
      const text = await file.text();
      console.log("Processando arquivo CSV...");
      
      const transactions = parseCSV(text, options);
      console.log("Transações CSV processadas:", transactions);
      
      return transactions;
    } catch (error) {
      console.error("Erro ao processar arquivo CSV:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo CSV");
      throw error;
    }
  };

  const detectColumns = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const columns = detectCSVColumns(text);
          resolve(columns);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsText(file);
    });
  };

  return { parseOFXFile, parseCSVFile, detectColumns };
}
