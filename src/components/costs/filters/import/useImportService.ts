
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Transaction } from "./types";

export function useImportService() {
  const { toast } = useToast();

  const importTransactions = async (selectedTransactions: Transaction[]): Promise<number> => {
    try {
      console.log("Iniciando importação de", selectedTransactions.length, "transações");
      
      // Verificar transações já importadas
      const fitIds = selectedTransactions.map(t => t.fitid);
      console.log("Verificando transações existentes para fitIds:", fitIds);
      
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
      console.log("Transações novas para importar:", newTransactions.length);

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
        try {
          console.log("----------------------------------");
          console.log("[Transação] Iniciando processamento:", transaction.name);
          console.log("[Transação] Valor:", transaction.amount);
          console.log("[Transação] Data:", transaction.date);
          console.log("[Transação] FitId:", transaction.fitid);
          
          // Buscar categoria sugerida do mapeamento
          console.log("[Categoria] Buscando sugestão para:", transaction.name);
          const { data: mappings, error: mappingError } = await supabase
            .from('transaction_categories_mapping')
            .select('category_id')
            .eq('description_pattern', transaction.name)
            .order('usage_count', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (mappingError) {
            console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
          }

          // Usar categoria sugerida ou a selecionada pelo usuário
          const categoryId = transaction.category || mappings?.category_id;
          console.log("[Categoria] ID final:", categoryId);

          // Validar categoria
          if (!categoryId) {
            console.warn("[Categoria] Transação sem categoria, pulando...");
            toast({
              title: "Transação pulada",
              description: `A transação "${transaction.name}" não possui categoria definida.`,
              variant: "warning"
            });
            continue;
          }

          // Inserir o custo
          console.log("[Custo] Inserindo custo para transação");
          const { data: cost, error: costError } = await supabase
            .from('costs')
            .insert({
              name: transaction.name,
              amount: transaction.amount,
              date: transaction.date,
              description: null,
            })
            .select('*')
            .maybeSingle();

          if (costError) {
            console.error("[Custo] Erro ao inserir:", costError);
            throw costError;
          }

          if (!cost) {
            console.error("[Custo] Não foi criado corretamente");
            throw new Error("Custo não foi criado corretamente");
          }

          console.log("[Custo] Criado com sucesso, ID:", cost.id);

          // Inserir a categoria do custo
          console.log("[Categoria] Inserindo relação com custo");
          const { error: categoriesError } = await supabase
            .from('costs_categories')
            .insert({
              cost_id: cost.id,
              category_id: categoryId
            });

          if (categoriesError) {
            console.error("[Categoria] Erro ao inserir:", categoriesError);
            throw categoriesError;
          }

          console.log("[Categoria] Relação criada com sucesso");

          // Registrar transação importada
          console.log("[Importação] Registrando transação");
          const { error: importError } = await supabase
            .from('imported_transactions')
            .insert({
              fitid: transaction.fitid,
              cost_id: cost.id
            });

          if (importError) {
            console.error("[Importação] Erro ao registrar:", importError);
            throw importError;
          }

          console.log("[Importação] Transação registrada com sucesso");
          importedCount++;

        } catch (error) {
          console.error("[ERRO] Falha ao processar transação:", error);
          toast({
            title: "Erro ao importar transação",
            description: `Erro ao importar "${transaction.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            variant: "destructive"
          });
        }
      }

      console.log("==================================");
      console.log("Importação finalizada. Total importado:", importedCount);
      
      if (importedCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${importedCount} transações foram importadas com sucesso.`,
          variant: "default"
        });
      }

      return importedCount;
      
    } catch (error) {
      console.error("Erro geral na importação:", error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante o processo de importação.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { importTransactions };
}
