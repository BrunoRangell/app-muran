
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição exata da transação:", JSON.stringify(description));
  console.log("[Entrada] Tipo da descrição:", typeof description);
  
  // Primeiro, tentar encontrar por qualquer um dos padrões usando in
  const { data, error: mappingError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .or('description_pattern.eq.' + JSON.stringify(description) + ',original_pattern.eq.' + JSON.stringify(description));

  if (mappingError) {
    console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
    throw mappingError;
  }

  console.log("[Categoria] Mapeamentos encontrados:", data);

  // Se não encontrou nada, vamos logar os valores para debug
  if (!data || data.length === 0) {
    console.log("[Debug] Buscando todos os mapeamentos para comparação:");
    const { data: allMappings } = await supabase
      .from('transaction_categories_mapping')
      .select('*');
    
    console.log("[Debug] Todos os mapeamentos disponíveis:", allMappings);
    console.log("[Debug] Comparando com a descrição:", description);
    
    // Tentar encontrar por correspondência exata sem usar .or
    const { data: exactMatch } = await supabase
      .from('transaction_categories_mapping')
      .select('*')
      .eq('description_pattern', description);
      
    console.log("[Debug] Tentativa de correspondência exata:", exactMatch);
  }

  const bestMatch = data?.[0];
  console.log("[Categoria] Melhor correspondência encontrada:", bestMatch);
  
  return bestMatch?.category_id;
}
