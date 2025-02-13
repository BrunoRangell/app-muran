
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição exata da transação:", JSON.stringify(description));
  console.log("[Entrada] Tipo da descrição:", typeof description);

  // Primeiro tentar encontrar por correspondência exata
  const { data: exactMatches, error: exactError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .eq('description_pattern', description);

  if (exactError) {
    console.error("[Categoria] Erro ao buscar mapeamento exato:", exactError);
    throw exactError;
  }

  if (exactMatches && exactMatches.length > 0) {
    console.log("[Categoria] Encontrada correspondência exata:", exactMatches[0]);
    return exactMatches[0].category_id;
  }

  // Se não encontrar correspondência exata, tentar por similaridade
  const searchTerm = description.includes('UNCLIK') ? 'UNCLIK' : 
                    description.includes('MINISTERIO DA FAZENDA') ? 'MINISTERIO DA FAZENDA' :
                    description.split('"')[1]?.split('-')[1] || description;

  console.log("[Categoria] Buscando por termo similar:", searchTerm);

  const { data: similarMatches, error: similarError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .or(`description_pattern.ilike.%${searchTerm}%,original_pattern.ilike.%${searchTerm}%,last_edited_pattern.ilike.%${searchTerm}%`);

  if (similarError) {
    console.error("[Categoria] Erro ao buscar mapeamento similar:", similarError);
    throw similarError;
  }

  console.log("[Categoria] Correspondências similares encontradas:", similarMatches);

  const bestMatch = similarMatches?.[0];
  console.log("[Categoria] Melhor correspondência encontrada:", bestMatch);
  
  return bestMatch?.category_id;
}
