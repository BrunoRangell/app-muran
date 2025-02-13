
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Transaction } from "./types";

export function useImportService() {
  const { toast } = useToast();

  const importTransactions = async (selectedTransactions: Transaction[]): Promise<number> => {
    // Verificar transações já importadas
    const fitIds = selectedTransactions.map(t => t.fitid);
    const { data: existingImports, error: checkError } = await supabase
      .from('imported_transactions')
      .select('fitid')
      .in('fitid', fitIds);

    if (checkError) {
      console.error("Erro ao verificar transações existentes:", checkError);
      throw new Error("Erro ao verificar transações existentes");
    }

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

    let importedCount = 0;

    // Importar transações como custos
    for (const transaction of newTransactions) {
      // Validar categoria
      if (!transaction.category) {
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
            description: null,
          })
          .select()
          .single();

        if (costError) {
          console.error("Erro ao inserir custo:", costError);
          throw costError;
        }

        if (!cost) {
          throw new Error("Custo não foi criado corretamente");
        }

        // Inserir a categoria do custo
        const { error: categoriesError } = await supabase
          .from('costs_categories')
          .insert({
            cost_id: cost.id,
            category_id: transaction.category
          });

        if (categoriesError) {
          console.error("Erro ao inserir categoria do custo:", categoriesError);
          throw categoriesError;
        }

        // Registrar transação importada
        const { error: importError } = await supabase
          .from('imported_transactions')
          .insert({
            fitid: transaction.fitid,
            cost_id: cost.id
          });

        if (importError) {
          console.error("Erro ao registrar importação:", importError);
          throw importError;
        }

        importedCount++;

      } catch (error) {
        console.error("Erro ao importar transação:", error);
        toast({
          title: "Erro ao importar transação",
          description: `Erro ao importar "${transaction.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
        // Não interrompe o loop, continua tentando importar as outras transações
      }
    }

    return importedCount;
  };

  return { importTransactions };
}
