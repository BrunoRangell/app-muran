
import { supabase } from "@/lib/supabase";
import { Transaction } from "../types";

function normalizeString(str: string): string {
  return str
    .trim()
    .replace(/["']/g, '') // Remove aspas simples e duplas
    .replace(/\s+/g, ' ')  // Remove espaços extras
    .replace(/[-:]/g, '')  // Remove hífens e dois pontos
    .normalize('NFD')      // Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase();        // Converte para minúsculas
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
  const exactMatch = allMappings?.find(mapping => {
    const normalizedPattern = normalizeString(mapping.description_pattern);
    console.log("[Debug] Comparando normalizado:", {
      entrada: normalizedDescription,
      padrao: normalizedPattern,
      igual: normalizedPattern === normalizedDescription
    });
    return normalizedPattern === normalizedDescription;
  });

  if (exactMatch) {
    console.log("[Categoria] Encontrada correspondência exata após normalização:", exactMatch);
    return exactMatch.category_id;
  }

  console.log("[Categoria] Nenhuma correspondência exata encontrada após normalização");
  
  // Log detalhado para todas as strings no banco
  if (allMappings) {
    console.log("[Debug] Todos os padrões disponíveis:");
    allMappings.forEach(mapping => {
      console.log({
        original: mapping.description_pattern,
        normalizado: normalizeString(mapping.description_pattern),
        categoria: mapping.category_id
      });
    });
  }

  return null;
}
