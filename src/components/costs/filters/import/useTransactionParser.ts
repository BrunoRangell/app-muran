
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { parseOFX } from 'ofx-js';
import { Transaction } from "./types";

export function useTransactionParser() {
  const { toast } = useToast();

  const parseOFXFile = async (file: File): Promise<Transaction[]> => {
    const text = await file.text();
    const ofx = await parseOFX(text);
    
    if (!ofx.bankAccounts?.[0]?.transactions) {
      throw new Error("Nenhuma transação encontrada no arquivo");
    }

    // Buscar mapeamentos existentes
    const { data: existingMappings } = await supabase
      .from('transaction_categories_mapping')
      .select('*')
      .order('usage_count', { ascending: false });

    return ofx.bankAccounts[0].transactions.map(t => {
      // Tentar encontrar um mapeamento existente
      const mapping = existingMappings?.find(m => 
        t.name.toLowerCase().includes(m.description_pattern.toLowerCase())
      );

      return {
        fitid: t.fitId,
        name: t.name,
        amount: Math.abs(Number(t.amount)), // Convertemos para positivo pois tratamos tudo como despesa
        date: new Date(t.date).toISOString().split('T')[0],
        selected: true,
        mainCategory: mapping?.main_category,
        subcategory: mapping?.subcategory
      };
    });
  };

  return { parseOFXFile };
}
