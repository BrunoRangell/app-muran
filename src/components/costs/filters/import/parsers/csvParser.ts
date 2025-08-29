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
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/, // DD/MM/YY ou D/M/YY
    /(\d{2})\/(\d{2})\/(\d{2})/, // DD/MM/YY
    /(\d{4})(\d{2})(\d{2})/, // YYYYMMDD (sem separadores)
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) { // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (format === formats[5]) { // YYYYMMDD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (format === formats[3] || format === formats[4]) { // DD/MM/YY
        let year = parseInt(match[3]);
        // Se ano tem 2 dígitos, assumir século 21 se < 50, senão século 20
        if (year < 50) year += 2000;
        else if (year < 100) year += 1900;
        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
      } else { // DD/MM/YYYY or DD-MM-YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
}

function parseAmount(amountStr: string): number {
  // Remover símbolos de moeda e espaços
  let cleaned = amountStr.replace(/[R$€$£¥\s]/g, '');
  
  // Detectar valores negativos (parênteses, sinal negativo no final)
  let isNegative = false;
  if (cleaned.includes('(') && cleaned.includes(')')) {
    isNegative = true;
    cleaned = cleaned.replace(/[()]/g, '');
  } else if (cleaned.endsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  }
  
  // Detectar formato de número (brasileiro vs internacional)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Se tem ambos, determinar qual é separador decimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastDot > lastComma) {
      // Ponto é decimal, vírgula é milhares: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Vírgula é decimal, ponto é milhares: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleaned.includes(',')) {
    // Apenas vírgula - pode ser decimal brasileiro ou separador de milhares
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Provavelmente decimal brasileiro: 123,45
      cleaned = cleaned.replace(',', '.');
    } else {
      // Provavelmente separador de milhares: 1,234,567
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) {
    throw new Error(`Valor não reconhecido: ${amountStr}`);
  }
  
  return isNegative ? -amount : amount;
}

export function detectCSVColumns(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const separator = detectSeparator(lines[0]);
  return parseCsvLine(lines[0], separator);
}