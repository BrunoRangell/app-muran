
import { toast } from "sonner";
import { Transaction } from "./types";
import { checkExistingTransactions } from "./services/existingTransactionsService";
import { 
  createCost, 
  assignCategoryToCost, 
  registerImportedTransaction 
} from "./services/costCreationService";

export function useImportService() {

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
        toast.error("Todas as transações selecionadas já foram importadas anteriormente.");
        return 0;
      }

      let importedCount = 0;
      let skippedCount = 0;

      // Importar transações como custos com timeout
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

          // Criar transação com timeout para evitar travamento
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Operação demorou mais de 30 segundos')), 30000)
          );

          const operationPromise = (async () => {
            const cost = await createCost(transaction, transaction.category);
            await assignCategoryToCost(cost.id, transaction.category);
            await registerImportedTransaction(transaction.fitid, cost.id);
            return cost;
          })();

          await Promise.race([operationPromise, timeoutPromise]);
          
          importedCount++;
          console.log("[Transação] Processada com sucesso:", transaction.name);

        } catch (error) {
          console.error("[ERRO] Falha ao processar transação:", error);
          skippedCount++;
          
          // Não interromper o processo por uma transação com erro
          if (error instanceof Error && error.message.includes('Timeout')) {
            console.error("[TIMEOUT] Transação travou:", transaction.name);
            toast.error(`Timeout ao importar "${transaction.name}". Transação pulada.`);
          } else {
            toast.error(`Erro ao importar "${transaction.name}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
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
        
        if (importedCount > 0) {
          toast.success(description.trim());
        } else {
          toast.error(description.trim());
        }
      }

      return importedCount;
      
    } catch (error) {
      console.error("Erro geral na importação:", error);
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro durante o processo de importação.");
      throw error;
    }
  };

  return { importTransactions };
}
