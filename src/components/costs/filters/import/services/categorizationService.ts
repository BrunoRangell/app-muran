
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
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
  console.log("[Categoria] Buscando sugestão para padrão:", pattern);
  const { data: mappings, error: mappingError } = await supabase
    .from('transaction_categories_mapping')
    .select('category_id, usage_count')
    .or('original_pattern.eq.' + JSON.stringify(pattern) + ',last_edited_pattern.eq.' + JSON.stringify(pattern))
    .order('usage_count', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mappingError) {
    console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
    throw mappingError;
  }

  console.log("[Categoria] Mapeamento encontrado:", mappings);
  return mappings?.category_id;
}
