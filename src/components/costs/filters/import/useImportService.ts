
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Transaction } from "./types";

export function useImportService() {
  const { toast } = useToast();

  const importTransactions = async (selectedTransactions: Transaction[]): Promise<number> => {
    // Verificar transações já importadas
    const fitIds = selectedTransactions.map(t => t.fitid);
    const { data: existingImports } = await supabase
      .from('imported_transactions')
      .select('fitid')
      .in('fitid', fitIds);

    const alreadyImported = new Set(existingImports?.map(i => i.fitid) || []);
    const newTransactions = selectedTransactions.filter(t => !alreadyImported.has(t.fitid));

    if (newTransactions.length === 0) {
      toast({
        title: "Transações já importadas",
        description: "Todas as transações selecionadas já foram importadas anteriormente.",
        variant: "destructive"
      });
      return 0;
    }

    // Importar transações como custos
    for (const transaction of newTransactions) {
      const { data: cost, error: costError } = await supabase
        .from('costs')
        .insert({
          name: transaction.name,
          amount: transaction.amount,
          date: transaction.date,
          main_category: transaction.mainCategory,
          subcategory: transaction.subcategory
        })
        .select()
        .single();

      if (costError) throw costError;

      // Registrar transação importada
      const { error: importError } = await supabase
        .from('imported_transactions')
        .insert({
          fitid: transaction.fitid,
          cost_id: cost.id
        });

      if (importError) throw importError;

      // Registrar ou atualizar mapeamento de categoria
      const { error: mappingError } = await supabase
        .from('transaction_categories_mapping')
        .upsert({
          description_pattern: transaction.name,
          main_category: transaction.mainCategory,
          subcategory: transaction.subcategory,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'description_pattern',
          ignoreDuplicates: false
        });

      if (mappingError) throw mappingError;
    }

    return newTransactions.length;
  };

  return { importTransactions };
}
