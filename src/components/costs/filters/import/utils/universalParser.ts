import { Transaction } from "../types";
import { UniversalMapping, FilePreview, OFXPreview } from "../types/mapping";

export async function createPreviewFromFile(file: File): Promise<FilePreview | OFXPreview> {
  const text = await file.text();
  
  if (file.name.toLowerCase().endsWith('.ofx')) {
    return createOFXPreview(text);
  } else {
    return createCSVPreview(text);
  }
}

function createOFXPreview(ofxText: string): OFXPreview {
  const lines = ofxText.split('\n');
  const availableFields: string[] = [];
  const sampleTransaction: Record<string, string> = {};
  let transactionCount = 0;
  let currentTransaction: Record<string, string> = {};
  let inTransaction = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('<STMTTRN>')) {
      inTransaction = true;
      currentTransaction = {};
    } else if (trimmedLine.startsWith('</STMTTRN>')) {
      if (Object.keys(currentTransaction).length > 0 && transactionCount === 0) {
        Object.assign(sampleTransaction, currentTransaction);
      }
      transactionCount++;
      inTransaction = false;
    } else if (inTransaction) {
      const fieldMatch = trimmedLine.match(/<([^>]+)>([^<]*)<\/[^>]+>/);
      if (fieldMatch) {
        const [, fieldName, value] = fieldMatch;
        const normalizedField = normalizeOFXField(fieldName);
        
        if (!availableFields.includes(normalizedField)) {
          availableFields.push(normalizedField);
        }
        
        currentTransaction[normalizedField] = value;
      }
    }
  }
  
  return {
    availableFields,
    sampleTransaction,
    totalTransactions: transactionCount,
  };
}

function createCSVPreview(csvText: string): FilePreview {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }
  
  const separator = detectSeparator(lines[0]);
  const headers = parseCsvLine(lines[0], separator);
  const rows = lines.slice(1, 11).map(line => parseCsvLine(line, separator)); // Primeiras 10 linhas para preview
  
  return {
    headers,
    rows,
    detectedSeparator: separator,
    totalRows: lines.length - 1,
  };
}

export function parseWithMapping(
  text: string, 
  mapping: UniversalMapping
): Transaction[] {
  if (mapping.fileType === 'ofx') {
    return parseOFXWithMapping(text, mapping);
  } else {
    return parseCSVWithMapping(text, mapping);
  }
}

function parseOFXWithMapping(ofxText: string, mapping: UniversalMapping): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = ofxText.split('\n');
  let currentTransaction: Record<string, string> = {};
  let inTransaction = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('<STMTTRN>')) {
      inTransaction = true;
      currentTransaction = {};
    } else if (trimmedLine.startsWith('</STMTTRN>')) {
      if (inTransaction && isValidOFXTransaction(currentTransaction, mapping)) {
        const transaction = createTransactionFromOFX(currentTransaction, mapping);
        if (transaction) {
          transactions.push(transaction);
        }
      }
      inTransaction = false;
    } else if (inTransaction) {
      const fieldMatch = trimmedLine.match(/<([^>]+)>([^<]*)<\/[^>]+>/);
      if (fieldMatch) {
        const [, fieldName, value] = fieldMatch;
        const normalizedField = normalizeOFXField(fieldName);
        currentTransaction[normalizedField] = value;
      }
    }
  }
  
  return transactions;
}

function parseCSVWithMapping(csvText: string, mapping: UniversalMapping): Transaction[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const separator = mapping.separator || detectSeparator(lines[0]);
  const startIndex = mapping.skipFirstRow ? 1 : 0;
  const transactions: Transaction[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], separator);
    const transaction = createTransactionFromCSV(row, mapping);
    if (transaction) {
      transactions.push(transaction);
    }
  }
  
  return transactions;
}

function createTransactionFromOFX(
  transactionData: Record<string, string>, 
  mapping: UniversalMapping
): Transaction | null {
  const date = formatDate(transactionData[mapping.dateField]);
  const amount = parseFloat(transactionData[mapping.amountField] || '0');
  const description = getOFXDescription(transactionData, mapping);
  
  if (!date || !description || isNaN(amount)) {
    return null;
  }
  
  // Filtrar por tipo de transação
  if (amount < 0 && !mapping.includeDebits) return null;
  if (amount > 0 && !mapping.includeCredits) return null;
  
  return {
    fitid: transactionData.fitid || `ofx_${Date.now()}_${Math.random()}`,
    name: description,
    amount: Math.abs(amount), // Sempre positivo para padronizar
    date,
    selected: true,
  };
}

function createTransactionFromCSV(
  row: string[], 
  mapping: UniversalMapping
): Transaction | null {
  const headers = ['date', 'description', 'amount']; // Simplificado para exemplo
  const dateIndex = headers.indexOf('date');
  const descIndex = headers.indexOf('description');
  const amountIndex = headers.indexOf('amount');
  
  if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
    return null;
  }
  
  const date = formatDate(row[dateIndex]);
  const description = row[descIndex]?.trim();
  const amount = parseAmount(row[amountIndex]);
  
  if (!date || !description || isNaN(amount)) {
    return null;
  }
  
  return {
    fitid: `csv_${Date.now()}_${Math.random()}`,
    name: description,
    amount: Math.abs(amount), // Sempre positivo
    date,
    selected: true,
  };
}

// Funções auxiliares
function normalizeOFXField(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    'DTPOSTED': 'date',
    'TRNAMT': 'amount',
    'FITID': 'fitid',
    'NAME': 'name',
    'MEMO': 'memo',
    'PAYEE': 'payee',
    'TRNTYPE': 'type',
  };
  
  return fieldMap[fieldName] || fieldName.toLowerCase();
}

function getOFXDescription(
  transactionData: Record<string, string>, 
  mapping: UniversalMapping
): string {
  if (Array.isArray(mapping.descriptionField)) {
    return mapping.descriptionField
      .map(field => transactionData[field])
      .filter(Boolean)
      .join(' - ');
  }
  
  return transactionData[mapping.descriptionField as string] || '';
}

function isValidOFXTransaction(
  transactionData: Record<string, string>, 
  mapping: UniversalMapping
): boolean {
  return !!(
    transactionData[mapping.dateField] &&
    transactionData[mapping.amountField] &&
    getOFXDescription(transactionData, mapping)
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // OFX format: YYYYMMDD
  if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  
  // Try other common formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        return dateStr; // Already in correct format
      } else {
        // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return '';
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return NaN;
  
  // Remove currency symbols and normalize
  const normalized = amountStr
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(normalized);
}

function detectSeparator(firstLine: string): string {
  const separators = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detectedSeparator = ',';
  
  for (const sep of separators) {
    const count = (firstLine.match(new RegExp(`\\${sep}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedSeparator = sep;
    }
  }
  
  return detectedSeparator;
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}