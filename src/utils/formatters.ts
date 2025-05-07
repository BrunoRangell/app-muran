
// Função para converter strings numéricas com formatos como "1.000,00" para number
export function parseCurrencyToNumber(value: string): number {
  // Remover símbolos de moeda, espaços, pontos e converter vírgula para ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
}

// Função para formatar um número como moeda (R$ 1.000,00)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Função para formatar uma data como string no formato brasileiro
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Função para formatar porcentagem
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Função para formatar números com separadores de milhar
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
