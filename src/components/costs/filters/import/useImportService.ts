
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
      // Validar categorias
      if (!transaction.categories || transaction.categories.length === 0) {
        console.error("Transação sem categoria:", transaction);
        continue;
      }

      try {
        // Inserir o custo
        const { data: cost, error: costError } = await supabase
          .from('costs')
          .insert({
            name: transaction.name,
            amount: transaction.amount,
            date: transaction.date,
          })
          .select()
          .single();

        if (costError) throw costError;

        // Inserir as categorias do custo
        const categoriesInsertData = transaction.categories.map(categoryId => ({
          cost_id: cost.id,
          category_id: categoryId
        }));

        const { error: categoriesError } = await supabase
          .from('costs_categories')
          .insert(categoriesInsertData);

        if (categoriesError) throw categoriesError;

        // Registrar transação importada
        const { error: importError } = await supabase
          .from('imported_transactions')
          .insert({
            fitid: transaction.fitid,
            cost_id: cost.id
          });

        if (importError) throw importError;

        // Atualizar mapeamentos de categoria
        for (const categoryId of transaction.categories) {
          const { error: mappingError } = await supabase
            .from('transaction_categories_mapping')
            .upsert({
              description_pattern: transaction.name,
              category_id: categoryId,
              usage_count: 1,
              last_used_at: new Date().toISOString()
            }, {
              onConflict: 'description_pattern,category_id',
              ignoreDuplicates: false
            });

          if (mappingError) throw mappingError;
        }
      } catch (error) {
        console.error("Erro ao importar transação:", error);
        toast({
          title: "Erro ao importar transação",
          description: `Erro ao importar "${transaction.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
      }
    }

    return newTransactions.length;
  };

  return { importTransactions };
}
