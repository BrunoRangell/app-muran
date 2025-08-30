// Utilitários para normalização de pesquisa

/**
 * Normaliza um termo de pesquisa removendo acentos, caracteres especiais e convertendo para minúsculas
 * Para facilitar a busca de custos ignorando acentos e pontuações
 */
export function normalizeSearchTerm(term: string): string {
  if (!term) return "";
  
  return term
    .toLowerCase()
    .normalize("NFD") // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove diacríticos (acentos)
    .replace(/[^\w\s]/g, " ") // Remove pontuações, mantém apenas palavras e espaços
    .replace(/\s+/g, " ") // Colapsa múltiplos espaços em um
    .trim();
}

/**
 * Verifica se um texto contém todos os termos de pesquisa (busca flexível)
 */
export function matchesSearchTerms(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return true;
  
  const normalizedText = normalizeSearchTerm(text);
  const normalizedSearch = normalizeSearchTerm(searchTerm);
  const searchWords = normalizedSearch.split(" ").filter(word => word.length > 0);
  
  return searchWords.every(word => normalizedText.includes(word));
}