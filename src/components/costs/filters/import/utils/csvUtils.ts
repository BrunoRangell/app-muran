import { UniversalMapping } from "../types/mapping";

// Detectar automaticamente o mapeamento baseado nos nomes das colunas
export function detectCSVMapping(columns: string[]): Partial<UniversalMapping> {
  const mapping: Partial<UniversalMapping> = {
    skipFirstRow: true,
  };

  columns.forEach((column, index) => {
    const columnLower = column.toLowerCase().trim();
    
    if (!mapping.dateField && (
      columnLower.includes('data') ||
      columnLower.includes('date')
    )) {
      mapping.dateField = column;
    }
    
    if (!mapping.descriptionField && (
      columnLower.includes('descri') ||
      columnLower.includes('histor') ||
      columnLower.includes('memo')
    )) {
      mapping.descriptionField = column;
    }
    
    if (!mapping.amountField && (
      columnLower.includes('valor') ||
      columnLower.includes('amount')
    )) {
      mapping.amountField = column;
    }
  });

  return mapping;
}

// Validar se o mapeamento está completo
export function validateCSVMapping(mapping: UniversalMapping): boolean {
  return !!(mapping.dateField && mapping.descriptionField && mapping.amountField);
}

// Sugestões de perfis para bancos conhecidos
export const bankProfiles: Record<string, any> = {
  'itau': {
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 2,
    skipFirstRow: true,
    separator: ';',
  },
  'bradesco': {
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 3,
    skipFirstRow: true,
    separator: ';',
  },
  'santander': {
    dateColumn: 0,
    descriptionColumn: 1,
    amountColumn: 4,
    skipFirstRow: true,
    separator: ';',
  },
  'nubank': {
    dateColumn: 0,
    descriptionColumn: 2,
    amountColumn: 1,
    skipFirstRow: true,
    separator: ',',
  },
};

// Detectar possível banco baseado no formato do CSV
export function detectBankProfile(columns: string[], preview: string[][]): string | null {
  const firstRowText = columns.join(' ').toLowerCase();
  
  if (firstRowText.includes('itau') || firstRowText.includes('itaú')) {
    return 'itau';
  }
  
  if (firstRowText.includes('bradesco')) {
    return 'bradesco';
  }
  
  if (firstRowText.includes('santander')) {
    return 'santander';
  }
  
  if (firstRowText.includes('nubank')) {
    return 'nubank';
  }
  
  return null;
}