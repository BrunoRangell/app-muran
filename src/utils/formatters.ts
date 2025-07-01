
// Utilitários para formatação de valores monetários

export const formatCurrency = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return "R$ 0,00";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const parseCurrencyToNumber = (value: string): number => {
  if (!value || typeof value !== 'string') {
    return 0;
  }
  
  // Remove todos os caracteres não numéricos exceto vírgula e ponto
  const cleanValue = value
    .replace(/[^\d,.-]/g, '') // Remove símbolos de moeda, espaços, etc.
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.'); // Converte vírgula para ponto decimal
  
  const numericValue = parseFloat(cleanValue);
  
  return isNaN(numericValue) ? 0 : numericValue;
};

export const formatNumber = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return "0";
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
};
