
// Formatar valor para moeda brasileira
export const formatCurrency = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return "R$ 0,00";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('R$', 'R$ ');
};

// Formatar percentual
export const formatPercentage = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return "0%";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Formatar data
export const formatDate = (date: Date | string): string => {
  if (!date) return "";
  
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObject);
};

/**
 * Converte uma string de moeda formatada (ex: "R$ 1.234,56") para um valor numérico
 * @param value String formatada como moeda brasileira
 * @returns Valor numérico
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  
  // Remove o símbolo da moeda (R$), pontos de milhar e substitui vírgula por ponto
  const numericString = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  // Converte para número
  const number = parseFloat(numericString.trim());
  
  // Retorna 0 se não for um número válido
  return isNaN(number) ? 0 : number;
};

/**
 * Formata um número de telefone para o formato brasileiro
 * @param phone Número de telefone (pode conter apenas dígitos ou já estar parcialmente formatado)
 * @returns Telefone formatado
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Verifica o tamanho para determinar se é celular ou fixo
  if (numbers.length === 11) {
    // Celular: (99) 99999-9999
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    // Fixo: (99) 9999-9999
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 9) {
    // Celular sem DDD: 99999-9999
    return numbers.replace(/(\d{5})(\d{4})/, '$1-$2');
  } else if (numbers.length === 8) {
    // Fixo sem DDD: 9999-9999
    return numbers.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  // Se não se encaixar em nenhum formato conhecido, retorna como está
  return phone;
};
