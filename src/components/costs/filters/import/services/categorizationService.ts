
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição exata da transação:", JSON.stringify(description));

  // Primeiro tentar encontrar por correspondência exata
  const { data: exactMatches, error: exactError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .eq('description_pattern', description)
    .maybeSingle();

  if (exactError) {
    console.error("[Categoria] Erro ao buscar mapeamento exato:", exactError);
    throw exactError;
  }

  if (exactMatches) {
    console.log("[Categoria] Encontrada correspondência exata:", exactMatches);
    return exactMatches.category_id;
  }

  // Se não encontrar correspondência exata, tentar por parte do nome
  const { data: similarMatches, error: similarError } = await supabase
    .from('transaction_categories_mapping')
    .select('*')
    .eq('last_edited_pattern', 'UNCLIK CONTABILIDADE DIGITAL LTDA');

  if (similarError) {
    console.error("[Categoria] Erro ao buscar mapeamento similar:", similarError);
    throw similarError;
  }

  console.log("[Categoria] Correspondências similares encontradas:", similarMatches);

  const bestMatch = similarMatches?.[0];
  console.log("[Categoria] Melhor correspondência encontrada:", bestMatch);
  
  return bestMatch?.category_id;
}
