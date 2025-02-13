
import { supabase } from "@/lib/supabase";

export async function checkExistingTransactions(fitIds: string[]) {
  try {
    console.log("Verificando transações existentes para fitIds:", fitIds);
    
    const { data: existingImports, error: checkError } = await supabase
      .from('imported_transactions')
      .select('fitid')
      .in('fitid', fitIds);

    if (checkError) {
      console.error("Erro ao verificar transações existentes:", checkError);
      throw new Error(`Erro ao verificar transações existentes: ${checkError.message}`);
    }

    if (!existingImports) {
      console.log("Nenhuma transação existente encontrada");
      return new Set();
    }

    console.log("Resultado da verificação de transações existentes:", existingImports);
    const importedIds = new Set(existingImports.map(i => i.fitid));
    console.log("IDs de transações já importadas:", Array.from(importedIds));
    
    return importedIds;
  } catch (error) {
    console.error("Erro inesperado ao verificar transações:", error);
    throw error;
  }
}
