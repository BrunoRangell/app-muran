
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição da transação:", description);
  
  // Extrair padrão da transação atual
  const { data: pattern, error: patternError } = await supabase
    .rpc('extract_transaction_pattern', {
      description: description
    });

  if (patternError) {
    console.error("[Padrão] Erro ao extrair padrão:", patternError);
    throw patternError;
  }

  console.log("[Padrão] Extraído:", pattern);
  
  // Buscar categoria sugerida do mapeamento, verificando tanto o padrão original quanto o editado
  const query = 'original_pattern.eq.' + JSON.stringify(pattern) + ',last_edited_pattern.eq.' + JSON.stringify(pattern);
  console.log("[Categoria] Query de busca:", query);
  
  const { data: mappings, error: mappingError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .or(query)
    .order('usage_count', { ascending: false });

  if (mappingError) {
    console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
    throw mappingError;
  }

  console.log("[Categoria] Todos os mapeamentos encontrados:", mappings);
  
  const bestMatch = mappings?.[0];
  console.log("[Categoria] Melhor correspondência:", bestMatch);
  
  return bestMatch?.category_id;
}
