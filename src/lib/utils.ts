
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar um número como moeda (R$ 1.000,00)
export function formatCurrency(value: number | string): string {
  // Se for string, converter para número primeiro
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}
