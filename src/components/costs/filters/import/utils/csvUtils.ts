import { CSVMapping } from "../components/CSVMappingDialog";

// Detectar automaticamente o mapeamento baseado nos nomes das colunas
export function detectCSVMapping(columns: string[]): Partial<CSVMapping> {
  const mapping: Partial<CSVMapping> = {
    skipFirstRow: true, // Padrão para CSVs com cabeçalho
  };

  columns.forEach((column, index) => {
    const columnLower = column.toLowerCase().trim();
    
    // Detectar coluna de data
    if (!mapping.dateColumn && (
      columnLower.includes('data') ||
      columnLower.includes('date') ||
      columnLower.includes('fecha') ||
      columnLower === 'dt'
    )) {
      mapping.dateColumn = index;
    }
    
    // Detectar coluna de descrição/nome
    if (!mapping.descriptionColumn && (
      columnLower.includes('descri') ||
      columnLower.includes('histor') ||
      columnLower.includes('memo') ||
      columnLower.includes('name') ||
      columnLower.includes('nome') ||
      columnLower.includes('estabelecimento') ||
      columnLower.includes('loja')
    )) {
      mapping.descriptionColumn = index;
    }
    
    // Detectar coluna de valor
    if (!mapping.amountColumn && (
      columnLower.includes('valor') ||
      columnLower.includes('amount') ||
      columnLower.includes('quantia') ||
      columnLower.includes('preco') ||
      columnLower.includes('debito') ||
      columnLower.includes('credito') ||
      columnLower === 'r$' ||
      columnLower === '$'
    )) {
      mapping.amountColumn = index;
    }
  });

  return mapping;
}

// Validar se o mapeamento está completo
export function validateCSVMapping(mapping: CSVMapping): boolean {
  return (
    mapping.dateColumn !== undefined &&
    mapping.descriptionColumn !== undefined &&
    mapping.amountColumn !== undefined
  );
}

// Sugestões de perfis para bancos conhecidos
export const bankProfiles: Record<string, CSVMapping> = {
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