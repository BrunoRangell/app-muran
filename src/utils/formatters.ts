
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
