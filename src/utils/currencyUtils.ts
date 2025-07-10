
// Utilitários para formatação de moeda brasileira

export const formatBrazilianCurrency = (value: string | number): string => {
  if (!value || value === '') return '';
  
  // Se já é uma string, limpar e converter
  let numericValue: number;
  if (typeof value === 'string') {
    numericValue = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
  } else {
    numericValue = value;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

export const parseBrazilianCurrency = (value: string): number => {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove tudo exceto números, vírgulas e pontos
  const cleanValue = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '') // Remove pontos (separadores de milhares)
    .replace(',', '.'); // Converte vírgula para ponto decimal
  
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

export const formatCurrencyInput = (value: string): string => {
  // Remove caracteres não numéricos exceto vírgula
  const cleanValue = value.replace(/[^\d,]/g, '');
  
  // Se está vazio, retorna vazio
  if (!cleanValue) return '';
  
  // Separa parte inteira e decimal
  const parts = cleanValue.split(',');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Adiciona pontos como separadores de milhares
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Reconstrói o valor
  if (decimalPart !== undefined) {
    return `${integerPart},${decimalPart.slice(0, 2)}`;
  }
  
  return integerPart;
};
