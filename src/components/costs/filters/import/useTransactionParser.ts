
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { parseOFX } from "./ofxParser";
import { Transaction } from "./types";
import { CostCategory } from "@/types/cost";

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

      // Buscar mapeamentos existentes
      const { data: existingMappings, error } = await supabase
        .from('transaction_categories_mapping')
        .select('category_id, description_pattern')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error("Erro ao buscar mapeamentos:", error);
        throw error;
      }

      // Função para normalizar texto
      const normalizeText = (text: string) => 
        text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      // Processar transações
      const transactions = ofx.bankAccounts[0].transactions.map(t => {
        const normalizedName = normalizeText(t.name);
        
        // Encontrar categorias mapeadas
        const mappedCategories = existingMappings
          ?.filter(m => {
            const normalizedPattern = normalizeText(m.description_pattern);
            return normalizedName.includes(normalizedPattern) || 
                   normalizedPattern.includes(normalizedName);
          })
          .map(m => m.category_id as CostCategory)
          .filter(Boolean) || [];

        console.log(`Categorias encontradas para "${t.name}":`, mappedCategories);

        // Criar objeto de transação
        return {
          fitid: t.fitId,
          name: t.name,
          amount: Math.abs(Number(t.amount)),
          date: t.date,
          selected: true,
          categories: mappedCategories
        };
      });

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
