
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
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
  return mappings?.category_id;
}
