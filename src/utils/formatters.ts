
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

export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error("Data inválida:", dateString);
      return typeof dateString === 'string' ? dateString : '';
    }
    
    // Formatar a data no padrão brasileiro
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return typeof dateString === 'string' ? dateString : '';
  }
};

export const formatPercentage = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return "0%";
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

export const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  
  // Remove todos os caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Aplica a máscara do telefone brasileiro
  if (cleanValue.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    // Celular: (XX) XXXXX-XXXX
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
};
