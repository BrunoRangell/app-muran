
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição exata da transação:", JSON.stringify(description));
  
  // Buscar diretamente pelo padrão original ou editado na tabela de mapeamentos
  const { data, error: mappingError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .eq('description_pattern', description);

  if (mappingError) {
    console.error("[Categoria] Erro ao buscar mapeamento:", mappingError);
    throw mappingError;
  }

  let mappings = data;

  if (!mappings || mappings.length === 0) {
    console.log("[Categoria] Tentativa 1 - Nenhum mapeamento encontrado com description_pattern");
    
    // Se não encontrou, tenta pelo padrão original
    const { data: originalMappings, error: originalError } = await supabase
      .from('transaction_categories_mapping')
      .select('*')
      .eq('original_pattern', description);

    if (originalError) {
      console.error("[Categoria] Erro ao buscar mapeamento original:", originalError);
      throw originalError;
    }

    console.log("[Categoria] Tentativa 2 - Mapeamentos encontrados por original_pattern:", originalMappings);
    mappings = originalMappings;
  } else {
    console.log("[Categoria] Mapeamentos encontrados por description_pattern:", mappings);
  }

  const bestMatch = mappings?.[0];
  console.log("[Categoria] Melhor correspondência encontrada:", bestMatch);
  
  return bestMatch?.category_id;
}
