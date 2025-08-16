import { Transaction } from "../types";

interface CSVParseOptions {
  separator?: string;
  dateColumn: number;
  descriptionColumn: number;
  amountColumn: number;
  skipFirstRow?: boolean;
}

export function parseCSV(text: string, options: CSVParseOptions): Transaction[] {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error("Arquivo CSV vazio");
  }

  const dataLines = options.skipFirstRow ? lines.slice(1) : lines;
  const separator = options.separator || detectSeparator(lines[0]);

  return dataLines.map((line, index) => {
    const columns = parseCsvLine(line, separator);
    
    if (columns.length < Math.max(options.dateColumn, options.descriptionColumn, options.amountColumn) + 1) {
      throw new Error(`Linha ${index + 1} tem menos colunas que o esperado`);
    }

    const dateStr = columns[options.dateColumn]?.trim();
    const description = columns[options.descriptionColumn]?.trim();
    const amountStr = columns[options.amountColumn]?.trim();

    if (!dateStr || !description || !amountStr) {
      throw new Error(`Dados incompletos na linha ${index + 1}`);
    }

    const date = parseDate(dateStr);
    const amount = parseAmount(amountStr);

    return {
      fitid: `csv-${Date.now()}-${index}`,
      name: description,
      originalName: description,
      amount: Math.abs(amount),
      date: date.toISOString().split('T')[0],
      selected: true,
    };
  });
}

function detectSeparator(firstLine: string): string {
  const separators = [',', ';', '\t'];
  const counts = separators.map(sep => firstLine.split(sep).length);
  const maxCount = Math.max(...counts);
  const bestIndex = counts.indexOf(maxCount);
  return separators[bestIndex];
}

function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(col => col.replace(/^"|"$/g, ''));
}

function parseDate(dateStr: string): Date {
  // Tentar vários formatos comuns
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) { // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else { // DD/MM/YYYY or DD-MM-YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
}

function parseAmount(amountStr: string): number {
  // Remover símbolos de moeda e espaços
  let cleaned = amountStr.replace(/[R$\s]/g, '');
  
  // Trocar vírgula por ponto se for decimal brasileiro
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // Se tem ambos, assumir que vírgula é separador de milhares
    cleaned = cleaned.replace(',', '');
  }

  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) {
    throw new Error(`Valor não reconhecido: ${amountStr}`);
  }
  
  return amount;
}

export function detectCSVColumns(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const separator = detectSeparator(lines[0]);
  return parseCsvLine(lines[0], separator);
}