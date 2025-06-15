
/**
 * Utilitários para trabalhar com timezone brasileiro (America/Sao_Paulo)
 */

/**
 * Obtém a data atual no timezone brasileiro no formato YYYY-MM-DD
 */
export const getTodayInBrazil = (): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()).split('/').reverse().join('-');
};

/**
 * Obtém a data/hora atual no timezone brasileiro
 */
export const getNowInBrazil = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
};

/**
 * Converte uma data para o timezone brasileiro no formato YYYY-MM-DD
 */
export const formatDateToBrazilTimezone = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).split('/').reverse().join('-');
};

/**
 * Formata uma data para exibição em português brasileiro
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  }).format(date);
};
