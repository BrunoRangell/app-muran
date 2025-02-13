
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Transaction } from "./types";

export function useImportService() {
  const { toast } = useToast();

  const importTransactions = async (selectedTransactions: Transaction[]): Promise<number> => {
    try {
      console.log("==================================");
      console.log("Iniciando importação de", selectedTransactions.length, "transações");
      console.log("Transações a importar:", selectedTransactions);
      
      // Verificar transações já importadas
      const fitIds = selectedTransactions.map(t => t.fitid);
      console.log("Verificando transações existentes para fitIds:", fitIds);
      
      const { data: existingImports, error: checkError } = await supabase
        .from('imported_transactions')
        .select('fitid')
        .in('fitid', fitIds);

      if (checkError) {
        console.error("Erro ao verificar transações existentes:", checkError);
        throw new Error(`Erro ao verificar transações existentes: ${checkError.message}`);
      }

      console.log("Resultado da verificação de transações existentes:", existingImports);

      const alreadyImported = new Set(existingImports?.map(i => i.fitid) || []);
      const newTransactions = selectedTransactions.filter(t => !alreadyImported.has(t.fitid));
      console.log("Transações novas para importar:", newTransactions.length);
      console.log("Detalhes das novas transações:", newTransactions);

      if (newTransactions.length === 0) {
        toast({
          title: "Transações já importadas",
          description: "Todas as transações selecionadas já foram importadas anteriormente.",
          variant: "destructive"
        });
        return 0;
      }

      let importedCount = 0;
      let skippedCount = 0;

      // Importar transações como custos
      for (const transaction of newTransactions) {
        try {
          console.log("----------------------------------");
          console.log("[Transação] Iniciando processamento:", transaction.name);
          console.log("[Transação] Detalhes completos:", transaction);
          
          // Executar função de extração de padrão
          const { data: pattern, error: patternError } = await supabase
            .rpc('extract_transaction_pattern', {
              description: transaction.originalName || transaction.name
            });

          if (patternError) {
            console.error("[Padrão] Erro ao extrair padrão:", patternError);
            throw patternError;
          }

          console.log("[Padrão] Extraído:", pattern);
          
          // Buscar categoria sugerida do mapeamento
          console.log("[Categoria] Buscando sugestão para padrão:", pattern);
          const { data: mappings, error: mappingError } = await supabase
            .from('transaction_categories_mapping')
            .select('category_id')
            .eq('description_pattern', pattern)
            .order('usage_count', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (mappingError) {
            console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
            throw mappingError;
          }

          console.log("[Categoria] Mapeamento encontrado:", mappings);

          // Usar categoria sugerida ou a selecionada pelo usuário
          const categoryId = transaction.category || mappings?.category_id;
          console.log("[Categoria] ID final:", categoryId);

          // Validar categoria
          if (!categoryId) {
            console.warn("[Categoria] Transação sem categoria, pulando...");
            skippedCount++;
            continue;
          }

          // Inserir o custo
          console.log("[Custo] Inserindo custo para transação com dados:", {
            name: transaction.name,
            original_name: transaction.originalName || transaction.name,
            name_customized: transaction.originalName !== undefined && transaction.originalName !== transaction.name,
            amount: transaction.amount,
            date: transaction.date,
          });

          const { data: cost, error: costError } = await supabase
            .from('costs')
            .insert({
              name: transaction.name,
              original_name: transaction.originalName || transaction.name,
              name_customized: transaction.originalName !== undefined && transaction.originalName !== transaction.name,
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

          console.log("[Custo] Criado com sucesso:", cost);

          // Inserir a categoria do custo
          console.log("[Categoria] Inserindo relação com custo. ID:", cost.id, "Categoria:", categoryId);
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
          console.log("[Importação] Registrando transação. FitId:", transaction.fitid, "CostId:", cost.id);
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
          throw error; // Re-throw para interromper o processo em caso de erro
        }
      }

      console.log("==================================");
      console.log("Importação finalizada.");
      console.log("Total importado:", importedCount);
      console.log("Total pulado:", skippedCount);
      
      // Feedback mais detalhado no final da importação
      if (importedCount > 0 || skippedCount > 0) {
        let description = "";
        if (importedCount > 0) {
          description += `${importedCount} transações importadas com sucesso. `;
        }
        if (skippedCount > 0) {
          description += `${skippedCount} transações puladas por falta de categoria.`;
        }
        
        toast({
          title: "Importação concluída",
          description: description.trim(),
          variant: importedCount > 0 ? "default" : "destructive"
        });
      }

      return importedCount;
      
    } catch (error) {
      console.error("Erro geral na importação:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante o processo de importação.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return { importTransactions };
}
