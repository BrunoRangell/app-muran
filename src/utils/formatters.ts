
import { formatDateBr } from "./dateFormatter";

// Centralizando todas as funções de formatação

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return formatDateBr(date);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  if (digits.length <= 10) return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
}

export function parseCurrencyToNumber(value: string): number {
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
}

export function getStatusBadgeProps(status: string, type: 'platform' | 'activity' = 'activity') {
  if (type === 'platform') {
    switch (status.toLowerCase()) {
      case 'meta':
        return {
          className: 'bg-blue-500 text-white hover:bg-blue-600',
          text: 'Meta Ads'
        };
      case 'google':
        return {
          className: 'bg-yellow-500 text-white hover:bg-yellow-600', 
          text: 'Google Ads'
        };
      default:
        return {
          variant: 'secondary' as const,
          text: status
        };
    }
  }

  switch (status.toLowerCase()) {
    case 'active':
    case 'ativo':
    case 'true':
      return {
        variant: 'success' as const,
        text: 'Ativo'
      };
    case 'inactive':
    case 'inativo':
    case 'false':
      return {
        variant: 'secondary' as const,
        text: 'Inativo'
      };
    default:
      return {
        variant: 'secondary' as const,
        text: status
      };
  }
}
