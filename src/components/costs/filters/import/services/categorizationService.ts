
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

function normalizeString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')  // Remove espaços extras
    .normalize('NFD')      // Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

export async function suggestCategory(transaction: Transaction) {
  const description = transaction.originalName || transaction.name;
  
  console.log("[Entrada] Descrição exata da transação:", JSON.stringify(description));
  console.log("[Entrada] Descrição normalizada:", normalizeString(description));

  // Primeiro buscar todos os mapeamentos
  const { data: allMappings, error: mappingsError } = await supabase
    .from('transaction_categories_mapping')
    .select('*');

  if (mappingsError) {
    console.error("[Categoria] Erro ao buscar mapeamentos:", mappingsError);
    throw mappingsError;
  }

  // Procurar por correspondência exata após normalização
  const normalizedDescription = normalizeString(description);
  const exactMatch = allMappings?.find(mapping => 
    normalizeString(mapping.description_pattern) === normalizedDescription
  );

  if (exactMatch) {
    console.log("[Categoria] Encontrada correspondência exata após normalização:", exactMatch);
    return exactMatch.category_id;
  }

  console.log("[Categoria] Nenhuma correspondência exata encontrada após normalização");
  
  // Comparar strings para debug
  if (allMappings) {
    allMappings.forEach(mapping => {
      const normalizedPattern = normalizeString(mapping.description_pattern);
      console.log("[Debug] Comparando:", {
        pattern: mapping.description_pattern,
        normalizedPattern,
        matches: normalizedPattern === normalizedDescription,
        lengthPattern: normalizedPattern.length,
        lengthDescription: normalizedDescription.length
      });
    });
  }

  return null;
}
