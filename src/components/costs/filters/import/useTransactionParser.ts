
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
      console.log("Conteúdo do arquivo:", text.substring(0, 500)); // Log primeiros 500 caracteres
      
      const ofx = parseOFX(text);
      console.log("OFX parseado:", ofx);
      
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

      console.log("Mapeamentos encontrados:", existingMappings);

      return ofx.bankAccounts[0].transactions.map(t => {
        // Tentar encontrar um mapeamento existente
        const mappedCategories = existingMappings
          ?.filter(m => t.name.toLowerCase().includes(m.description_pattern.toLowerCase()))
          .map(m => m.category_id)
          .filter((id): id is CostCategory => id !== null) || [];

        console.log(`Categorias encontradas para "${t.name}":`, mappedCategories);

        return {
          fitid: t.fitId,
          name: t.name,
          amount: Math.abs(Number(t.amount)),
          date: t.date,
          selected: true,
          categories: mappedCategories
        };
      });
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
