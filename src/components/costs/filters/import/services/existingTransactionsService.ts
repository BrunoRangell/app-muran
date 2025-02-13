
import { supabase } from "@/lib/supabase";

export async function checkExistingTransactions(fitIds: string[]) {
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
  return new Set(existingImports?.map(i => i.fitid) || []);
}
