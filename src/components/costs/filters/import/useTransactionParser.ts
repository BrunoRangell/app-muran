
import { useToast } from "@/hooks/use-toast";
import { parseOFX } from "./ofxParser";
import { Transaction } from "./types";

export function useTransactionParser() {
  const { toast } = useToast();

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
        amount: Math.abs(Number(t.amount)),
        date: t.date,
        selected: true,
        categories: [] // Começa sem categorias, usuário deve selecionar manualmente
      }));

      console.log("Transações processadas:", transactions);
      return transactions;
    } catch (error) {
      console.error("Erro ao processar arquivo OFX:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido ao processar o arquivo",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { parseOFXFile };
}
