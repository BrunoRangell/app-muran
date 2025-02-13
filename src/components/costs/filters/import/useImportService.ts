
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "./types";
import { checkExistingTransactions } from "./services/existingTransactionsService";
import { 
  createCost, 
  assignCategoryToCost, 
  registerImportedTransaction 
} from "./services/costCreationService";

export function useImportService() {
  const { toast } = useToast();

  const importTransactions = async (selectedTransactions: Transaction[]): Promise<number> => {
    try {
      console.log("==================================");
      console.log("Iniciando importação de", selectedTransactions.length, "transações");
      console.log("Transações a importar:", selectedTransactions);
      
      // Verificar transações já importadas
      const fitIds = selectedTransactions.map(t => t.fitid);
      const alreadyImported = await checkExistingTransactions(fitIds);
      
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
          
          // Verificar se tem categoria selecionada
          if (!transaction.category) {
            console.warn("[Categoria] Transação sem categoria, pulando...");
            skippedCount++;
            continue;
          }

          // Criar e categorizar o custo
          const cost = await createCost(transaction, transaction.category);
          await assignCategoryToCost(cost.id, transaction.category);
          await registerImportedTransaction(transaction.fitid, cost.id);
          
          importedCount++;

        } catch (error) {
          console.error("[ERRO] Falha ao processar transação:", error);
          toast({
            title: "Erro ao importar transação",
            description: `Erro ao importar "${transaction.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            variant: "destructive"
          });
          throw error;
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
