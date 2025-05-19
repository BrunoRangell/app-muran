
import { formatDateBr } from "./dateFormatter";

// Função para converter strings numéricas com formatos como "1.000,00" para number
export function parseCurrencyToNumber(value: string): number {
  // Remover símbolos de moeda, espaços, pontos e converter vírgula para ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
}

// Função para formatar um número como moeda (R$ 1.000,00)
export function formatCurrency(value: number | string): string {
  // Se for string, converter para número primeiro
  const numValue = typeof value === 'string' ? parseCurrencyToNumber(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

// Função para formatar uma data como string no formato brasileiro
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  return formatDateBr(date);
}

// Função para formatar porcentagem
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Função para formatar números com separadores de milhar
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Função para formatar número de telefone no padrão brasileiro
export function formatPhoneNumber(value: string): string {
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  
  // Aplica a formatação de acordo com a quantidade de dígitos
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  } else {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
  }
}
