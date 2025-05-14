

/**
 * Formata um valor numérico para moeda (BRL)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '')) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Formata uma data para o formato brasileiro
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata uma porcentagem
 */
export const formatPercent = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Converte string de moeda para número
 */
export const parseCurrencyToNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  
  // Remove todos os caracteres não numéricos exceto vírgula e ponto
  const numericString = value.replace(/[^\d.,]/g, '');
  
  // Substitui vírgula por ponto para conversão correta
  const normalized = numericString.replace(',', '.');
  
  return parseFloat(normalized) || 0;
};

/**
 * Formata número de telefone para formato brasileiro
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numericOnly = phone.replace(/\D/g, '');
  
  if (numericOnly.length <= 2) {
    return numericOnly;
  } else if (numericOnly.length <= 6) {
    return `(${numericOnly.slice(0, 2)}) ${numericOnly.slice(2)}`;
  } else if (numericOnly.length <= 10) {
    return `(${numericOnly.slice(0, 2)}) ${numericOnly.slice(2, 6)}-${numericOnly.slice(6)}`;
  } else {
    return `(${numericOnly.slice(0, 2)}) ${numericOnly.slice(2, 7)}-${numericOnly.slice(7, 11)}`;
  }
};

/**
 * Alias para manter compatibilidade com código existente
 */
export const formatPercentage = formatPercent;

